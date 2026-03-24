import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Attendance, { ensureAttendanceIndexes } from "../../../models/Attendance";
import {
  ATTENDANCE_START_DATE,
  findApplicableHoliday,
  isSunday,
  toISODate,
  WINTER_VACATION_FROM,
  WINTER_VACATION_TO,
} from "../../../lib/attendanceEvents";

function getDateValidationMessage(dateString) {
  const todayISO = toISODate(new Date());

  if (!dateString) return "Attendance date is required";
  if (dateString < ATTENDANCE_START_DATE) {
    return "Attendance cannot be marked before January 1, 2026";
  }
  if (dateString >= WINTER_VACATION_FROM && dateString <= WINTER_VACATION_TO) {
    return "Attendance cannot be marked during winter vacation (January 1 to January 18, 2026)";
  }
  if (isSunday(dateString)) {
    return "Attendance cannot be marked on Sundays";
  }
  if (dateString > todayISO) {
    return "Attendance cannot be marked for a future date";
  }

  return "";
}

// NOTE: replace this with your real auth method
async function getMeOrThrow(request) {
  // Example: you already have /api/auth/me in your project
  const res = await fetch(new URL("/api/auth/me", request.url), {
    headers: { cookie: request.headers.get("cookie") || "" },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Unauthorized");
  return data.user;
}

export async function POST(request) {
  try {
    await connectDB();
    await ensureAttendanceIndexes();

    const me = await getMeOrThrow(request);
    if (String(me?.role || "").toLowerCase() !== "faculty") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { course, date, records, year } = body || {};

    if (!course || !date ||  !year || !Array.isArray(records)) {
      return NextResponse.json(
        { message: "course, date, records[] required" },
        { status: 400 }
      );
    }

    const dateValidationMessage = getDateValidationMessage(date);
    if (dateValidationMessage) {
      return NextResponse.json(
        { message: dateValidationMessage },
        { status: 400 }
      );
    }

    // lock to assigned course
    if (
      String(me.assignedCourse || "").toUpperCase() !==
      String(course).toUpperCase()
    ) {
      return NextResponse.json(
        { message: "Course not allowed" },
        { status: 403 }
      );
    }

    const existingHoliday = await findApplicableHoliday({
      date,
      course,
      year,
    });

    if (existingHoliday) {
      return NextResponse.json(
        {
          message: `This date is marked as a holiday${
            existingHoliday.title ? `: ${existingHoliday.title}` : ""
          }`,
        },
        { status: 400 }
      );
    }

    // Upsert = create if not exists, otherwise replace records
    const doc = await Attendance.findOneAndUpdate(
      { course: String(course).toUpperCase(), year: Number(year), date },
      {
        $set: {
          markedBy: me._id,
          records: records.map((r) => ({
            studentId: r.studentId,
            status: r.status,
          })),
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: "Saved", attendanceId: doc._id });
  } catch (e) {
    return NextResponse.json(
      { message: e.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const me = await getMeOrThrow(request);
    if (String(me?.role || "").toLowerCase() !== "faculty") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course");
    const year = searchParams.get("year");
    const date = searchParams.get("date");

    if (!course || !year || !date) {
      return NextResponse.json(
        { message: "course, year & date required" },
        { status: 400 }
      );
    }

    if (
      String(me.assignedCourse || "").toUpperCase() !==
      String(course).toUpperCase()
    ) {
      return NextResponse.json(
        { message: "Course not allowed" },
        { status: 403 }
      );
    }

    const doc = await Attendance.findOne({
      course: String(course).toUpperCase(),
      year: Number(year),
      date,
    }).lean();

    return NextResponse.json(doc || null);
  } catch (e) {
    return NextResponse.json(
      { message: e.message || "Server error" },
      { status: 500 }
    );
  }
}
