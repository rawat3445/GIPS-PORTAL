import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import { requireAdmin } from "../../../lib/auth";

/* ================= CREATE USER ================= */
export async function POST(req) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const {
      name,
      email,
      password,
      role,
      assignedCourse,
      enrollmentNo,
      course,
      year,
      phone,
    } = await req.json();

    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");
    const normalizedRole = String(role || "").trim().toLowerCase();
    const normalizedAssignedCourse = String(assignedCourse || "")
      .trim()
      .toUpperCase();
    const normalizedEnrollmentNo = String(enrollmentNo || "").trim();
    const normalizedCourse = String(course || "").trim().toUpperCase();
    const normalizedPhone = String(phone || "").trim();
    const normalizedYear =
      year === undefined || year === null || year === ""
        ? undefined
        : Number(year);

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      assignedCourse: normalizedAssignedCourse || undefined,
      enrollmentNo: normalizedEnrollmentNo || undefined,
      course: normalizedCourse || undefined,
      year: Number.isNaN(normalizedYear) ? undefined : normalizedYear,
      phone: normalizedPhone || undefined,
    });

    return NextResponse.json({ message: "User created" }, { status: 201 });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

/* ================= GET USERS ================= */
export async function GET(req) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    if (!role) {
      return NextResponse.json(
        { message: "Role query missing" },
        { status: 400 },
      );
    }

    const users = await User.find({ role }).select("-password");

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
