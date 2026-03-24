import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Attendance from "../../../models/Attendance";
import Holiday from "../../../models/Holiday";
import User from "../../../models/User";

const ATTENDANCE_START_DATE = "2026-01-01";
const WINTER_VACATION_FROM = "2026-01-01";
const WINTER_VACATION_TO = "2026-01-18";

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
    enrollmentNo: student.enrollmentNo || "",
    attendancePercentage,
    markedDays,
  };
}

function toISODate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function parseISODate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function addDays(dateString, days) {
  const date = parseISODate(dateString);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function isSunday(dateString) {
  return parseISODate(dateString).getDay() === 0;
}

function isWinterVacation(dateString) {
  return dateString >= WINTER_VACATION_FROM && dateString <= WINTER_VACATION_TO;
}

function countWorkingDays(fromDate, toDate, holidaySet) {
  if (!fromDate || fromDate > toDate) return 0;

  let total = 0;
  let cursor = fromDate;

  while (cursor <= toDate) {
    if (
      !isWinterVacation(cursor) &&
      !isSunday(cursor) &&
      !holidaySet.has(cursor)
    ) {
      total += 1;
    }

    cursor = addDays(cursor, 1);
  }

  return total;
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

    const attendancePerformanceRaw = await Attendance.aggregate([
      { $match: { course } },
      { $unwind: "$records" },
      {
        $group: {
          _id: "$records.studentId",
          marked: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ["$records.status", "present"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const todayISO = toISODate(new Date());
    const holidayDocs = await Holiday.find({
      date: { $gte: ATTENDANCE_START_DATE, $lte: todayISO },
    })
      .select("date")
      .lean();
    const holidaySet = new Set(holidayDocs.map((holiday) => holiday.date));

    const studentDocs = await User.find({
      role: "student",
      course,
    })
      .select("name email course year enrollmentNo createdAt")
      .lean();

    const performanceMap = new Map(
      attendancePerformanceRaw.map((item) => [
        String(item._id),
        { present: item.present || 0, marked: item.marked || 0 },
      ])
    );

    const highestAttendanceStudentList = studentDocs
      .map((student) => {
        const performance = performanceMap.get(String(student._id)) || {
          present: 0,
          marked: 0,
        };
        const workingDays = countWorkingDays(
          ATTENDANCE_START_DATE,
          todayISO,
          holidaySet
        );
        const attendancePercentage =
          performance.marked === 0
            ? 0
            : Number(
                ((performance.present / performance.marked) * 100).toFixed(1)
              );

        return {
          ...formatStudent(student, attendancePercentage, performance.marked),
          presentDays: performance.present,
          workingDays,
        };
      })
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
