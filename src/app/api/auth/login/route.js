import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "../../../lib/db";
import User from "../../../models/User";

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || "").trim());
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeEmailValue(value) {
  return String(value || "").trim().replace(/\s+/g, "").toLowerCase();
}

function normalizeEnrollmentValue(value) {
  return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
}

function buildIdentifierQuery(identifier) {
  const trimmed = String(identifier || "").trim();
  const emailLikeValue = normalizeEmailValue(trimmed);

  return {
    $or: [
      { email: emailLikeValue },
      { email: new RegExp(`^\\s*${escapeRegex(emailLikeValue)}\\s*$`, "i") },
      { enrollmentNo: trimmed },
      { enrollmentNo: new RegExp(`^\\s*${escapeRegex(trimmed)}\\s*$`, "i") },
    ],
  };
}

function userMatchesIdentifier(user, identifier) {
  const normalizedEmail = normalizeEmailValue(identifier);
  const normalizedEnrollment = normalizeEnrollmentValue(identifier);

  return (
    normalizeEmailValue(user?.email) === normalizedEmail ||
    normalizeEnrollmentValue(user?.enrollmentNo) === normalizedEnrollment
  );
}

async function passwordMatches(user, submittedPassword) {
  const rawStoredPassword = String(user?.password || "");
  const trimmedStoredPassword = rawStoredPassword.trim();
  const rawSubmittedPassword = String(submittedPassword || "");
  const trimmedSubmittedPassword = rawSubmittedPassword.trim();

  if (!trimmedStoredPassword) return false;

  if (isBcryptHash(trimmedStoredPassword)) {
    if (await bcrypt.compare(rawSubmittedPassword, trimmedStoredPassword)) {
      return true;
    }

    if (
      trimmedSubmittedPassword &&
      trimmedSubmittedPassword !== rawSubmittedPassword &&
      (await bcrypt.compare(trimmedSubmittedPassword, trimmedStoredPassword))
    ) {
      return true;
    }

    return false;
  }

  const matched =
    rawStoredPassword === rawSubmittedPassword ||
    trimmedStoredPassword === trimmedSubmittedPassword;

  if (!matched) return false;

  user.password = await bcrypt.hash(trimmedSubmittedPassword || rawSubmittedPassword, 10);
  await user.save();
  return true;
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const identifier = String(
      body?.email || body?.identifier || body?.enrollmentNo || ""
    ).trim();
    const password = String(body?.password || "");

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Email or enrollment number and password are required" },
        { status: 400 }
      );
    }

    let candidates = await User.find(buildIdentifierQuery(identifier))
      .select("+password")
      .sort({ role: 1, createdAt: 1 });

    if (!candidates.length) {
      const fallbackCandidates = await User.find({})
        .select("+password")
        .sort({ role: 1, createdAt: 1 });

      candidates = fallbackCandidates.filter((candidate) =>
        userMatchesIdentifier(candidate, identifier)
      );
    }

    if (!candidates.length) {
      console.warn("LOGIN_USER_NOT_FOUND", {
        identifier,
      });
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    let user = null;

    for (const candidate of candidates) {
      if (await passwordMatches(candidate, password)) {
        user = candidate;
        break;
      }
    }

    if (!user) {
      console.warn("LOGIN_PASSWORD_MISMATCH", {
        identifier,
        candidateCount: candidates.length,
        candidateIds: candidates.map((candidate) => candidate._id.toString()),
      });
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const role = String(user.role || "").toLowerCase();
    const assignedCourse = String(user.assignedCourse || "").toUpperCase();
    const redirectTo =
      role === "admin"
        ? "/dashboard/admin"
        : role === "faculty"
        ? assignedCourse
          ? `/dashboard/faculty/${assignedCourse}`
          : "/dashboard/faculty"
        : role === "student"
        ? "/dashboard/student"
        : "/";

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      message: "Login successful",
      role,
      redirectTo,
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
