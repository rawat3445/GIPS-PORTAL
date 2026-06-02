import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "./db";
import User from "../models/User";
import { evaluateStudentLoginAccess } from "./studentAccess";

async function getDecodedToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const decoded = await getDecodedToken();
  if (!decoded) {
    return { ok: false };
  }

  if (String(decoded.role || "").toLowerCase() !== "admin") {
    return { ok: false };
  }

  return { ok: true, decoded };
}

export async function requireFaculty() {
  const decoded = await getDecodedToken();
  if (!decoded) {
    return { ok: false };
  }

  if (String(decoded.role || "").toLowerCase() !== "faculty") {
    return { ok: false };
  }

  return { ok: true, decoded };
}

export async function requireStudent() {
  const decoded = await getDecodedToken();
  if (!decoded) {
    return { ok: false };
  }

  if (String(decoded.role || "").toLowerCase() !== "student") {
    return { ok: false };
  }

  await connectDB();
  const user = await User.findById(decoded.id).select(
    "role course year studentLoginWindowStartDate studentLoginResetAt studentLastLoginAt studentLastActivityAt studentLoginBlocked studentLoginBlockedAt",
  );

  if (!user || String(user.role || "").toLowerCase() !== "student") {
    return { ok: false };
  }

  const accessState = await evaluateStudentLoginAccess(user);

  if (accessState.isBlocked) {
    if (!user.studentLoginBlocked) {
      await User.collection.updateOne(
        { _id: user._id },
        {
          $set: {
            studentLoginBlocked: true,
            studentLoginBlockedAt: new Date(),
          },
        },
      );
    }

    return { ok: false };
  }

  return { ok: true, decoded, user };
}
