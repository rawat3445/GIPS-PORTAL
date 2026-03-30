import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "../../../lib/db";
import User from "../../../models/User";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await connectDB();

    const user = await User.findById(decoded.id).select(
      "name email role assignedCourse facultyType designation phone course year enrollmentNo profileImage",
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedCourse: user.assignedCourse || "",
        facultyType: user.facultyType || "teaching",
        designation: user.designation || "",
        phone: user.phone || "",
        course: user.course || user.assignedCourse || "",
        year: user.year || null,
        enrollmentNo: user.enrollmentNo || "",
        profileImage: user.profileImage || "",
      },
    });
  } catch (error) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}
