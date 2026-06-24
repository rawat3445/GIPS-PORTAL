import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import { requireAdmin } from "../../../../../lib/auth";
import User from "../../../../../models/User";
import { createStudentQrToken } from "../../../../../lib/qrAttendance";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    await connectDB();

    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const student = await User.findOne({ _id: id, role: "student" })
      .select("_id name email course year")
      .lean();

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
      token: createStudentQrToken(student),
      student: {
        _id: String(student._id),
        name: String(student.name || "").trim(),
        course: String(student.course || "").trim(),
        year: Number(student.year || 0),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
