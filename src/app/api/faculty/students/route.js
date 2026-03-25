import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import jwt from "jsonwebtoken";
import { getHolidayMapForStudentsOnDate } from "../../../lib/attendanceEvents";

export const runtime = "nodejs";

async function requireLogin(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error("JWT ERROR:", err);
    return null;
  }
}

export async function GET(request) {
  try {
    const auth = await requireLogin(request);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const course = (searchParams.get("course") || "").toUpperCase();
    const year = Number(searchParams.get("year"));
    const date = searchParams.get("date");

    if (!course) {
      return NextResponse.json({ message: "course required" }, { status: 400 });
    }

    await connectDB();

    if (!auth.role || !auth.id) {
      return NextResponse.json(
        { message: "Invalid token payload" },
        { status: 401 },
      );
    }

    const role = auth.role.toLowerCase();

    // FACULTY AUTH CHECK
    if (role === "faculty") {
      const me = await User.findById(auth.id).select("assignedCourse");
      if (!me) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      const facultyCourses = Array.isArray(me.assignedCourse)
        ? me.assignedCourse.map((c) => c.toUpperCase())
        : [String(me.assignedCourse).toUpperCase()];

      if (!facultyCourses.includes(course)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    } else if (role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const query = { role: "student", course };
    if (Number.isFinite(year) && year > 0) {
      query.year = year;
    }

    const students = await User.find(query)
      .select("name email enrollmentNo year course")
      .sort({ name: 1 });

    if (!date || !Number.isFinite(year) || year <= 0 || !students.length) {
      return NextResponse.json(students, { status: 200 });
    }

    const holidayMap = await getHolidayMapForStudentsOnDate({
      date,
      course,
      year,
      studentIds: students.map((student) => student._id.toString()),
    });

    const studentsWithEvents = students.map((student) => {
      const eventInfo = holidayMap.get(student._id.toString());

      return {
        ...student.toObject(),
        activeEvent: eventInfo
          ? {
              title: eventInfo.title,
              eventType: eventInfo.eventType || "holiday",
              scopeType: eventInfo.scopeType,
              fromDate: eventInfo.fromDate,
              toDate: eventInfo.toDate,
              course: eventInfo.course || "",
              year: eventInfo.year ?? null,
              studentId: eventInfo.studentId ?? null,
            }
          : null,
      };
    });

    return NextResponse.json(studentsWithEvents, { status: 200 });
  } catch (e) {
    console.error("STUDENTS API ERROR:", e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
