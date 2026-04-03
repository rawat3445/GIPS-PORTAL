import connectDB from "../../../lib/db";
import User from "../../../models/User";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const STUDENT_COURSES = ["BPT", "BOPTOM", "BMRIT", "DOPTOM", "BOTT"];

export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const enrollmentNo = String(body?.enrollmentNo || "").trim();
    const course = String(body?.course || "").trim().toUpperCase();
    const phone = String(body?.phone || "").trim();
    const year =
      body?.year === undefined || body?.year === null || body?.year === ""
        ? NaN
        : Number(body.year);

    if (!name || !email || !password || !enrollmentNo || !course || !phone) {
      return NextResponse.json(
        { message: "All student fields are required" },
        { status: 400 }
      );
    }

    if (!STUDENT_COURSES.includes(course)) {
      return NextResponse.json(
        { message: "Invalid course selected" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(year) || year < 1 || year > 4) {
      return NextResponse.json(
        { message: "Year must be between 1 and 4" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({
      $or: [{ email }, { enrollmentNo }],
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists with this email or enrollment number" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
      enrollmentNo,
      course,
      year,
      phone,
    });

    return NextResponse.json(
      { message: "Student account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { message: "Registration failed", error: error.message },
      { status: 500 }
    );
  }
}
