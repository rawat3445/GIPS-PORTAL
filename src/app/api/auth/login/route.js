import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "../../../lib/db";
import User from "../../../models/User";

export async function POST(req) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    // 1️⃣ Check user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 2️⃣ Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3️⃣ Create JWT
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

    // 4️⃣ Send response + cookie
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
