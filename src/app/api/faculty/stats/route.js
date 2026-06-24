import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import { buildStudentAttendancePerformanceList } from "../../../lib/attendancePerformance";

async function getMeOrThrow(request) {
  const res = await fetch(new URL("/api/auth/me", request.url), {
    headers: { cookie: request.headers.get("cookie") || "" },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Unauthorized");
  return data.user;
}

function formatStudent(student, attendancePercentage, markedDays) {
  return {
    _id: String(student._id),
    name: student.name,
    email: student.email,
    course: student.course || "",
    year: student.year || "",
    attendancePercentage,
    markedDays,
  };
}

export async function GET(request) {
  try {
    await connectDB();

    const me = await getMeOrThrow(request);
    if (String(me?.role || "").toLowerCase() !== "faculty") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const course = String(me?.assignedCourse || "").toUpperCase();
    if (!course) {
      return NextResponse.json(
        { message: "Faculty course missing" },
        { status: 400 }
      );
    }

    const studentDocs = await User.find({
      role: "student",
      course,
    })
      .select("name email course year createdAt")
      .lean();

    const performanceStudents = await buildStudentAttendancePerformanceList(
      studentDocs
    );

    const highestAttendanceStudentList = performanceStudents
      .map((student) => ({
        ...formatStudent(
          student,
          student.attendancePercentage,
          student.markedDays
        ),
        presentDays: student.presentDays,
        workingDays: student.workingDays,
      }))
      .filter(
        (student) => student.markedDays > 0 && student.attendancePercentage >= 75
      )
      .sort((a, b) => {
        if (a.attendancePercentage !== b.attendancePercentage) {
          return b.attendancePercentage - a.attendancePercentage;
        }
        return b.presentDays - a.presentDays;
      })
      .slice(0, 10);

    return NextResponse.json({
      highestAttendanceStudents: highestAttendanceStudentList.length,
      highestAttendanceStudentList,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
