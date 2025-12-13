import { connectDB } from "../../../lib/db";
import User from "../../../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    await connectDB();

    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 400 }
      );

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 400 }
      );

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send redirect + cookie
    const response = NextResponse.json({
      message: "Login successful",
      role: user.role,
    });
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
