import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Attendance from "../../../../models/Attendance";
import User from "../../../../models/User";
import {
  addDays,
  ATTENDANCE_START_DATE,
  COLLEGE_RESUME_DATE,
  getCalendarEndDateForContext,
  getHolidayMapForContext,
  isSunday,
  isWinterVacation,
  parseISODate,
  toISODate,
  WINTER_VACATION_FROM,
  WINTER_VACATION_TO,
} from "../../../../lib/attendanceEvents";

const APPROVED_OR_LEGACY_ATTENDANCE_QUERY = [
  { approvalStatus: "approved" },
  { approvalStatus: { $exists: false } },
];

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

async function getMeOrThrow(request) {
  const res = await fetch(new URL("/api/auth/me", request.url), {
    headers: { cookie: request.headers.get("cookie") || "" },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Unauthorized");
  return data.user;
}

async function buildStudentAttendanceSummary(student) {
  const todayISO = toISODate(new Date());
  const calendarEndDate = await getCalendarEndDateForContext({
    course: student.course,
    year: student.year,
    studentId: student._id,
  });
  const holidayMap = await getHolidayMapForContext({
    fromDate: ATTENDANCE_START_DATE,
    toDate: calendarEndDate,
    course: student.course,
    year: student.year,
    studentId: student._id,
  });
  const docs = await Attendance.find({
    course: String(student.course || "").toUpperCase(),
    year: Number(student.year),
    date: { $gte: ATTENDANCE_START_DATE, $lte: todayISO },
    "records.studentId": student._id,
    $or: APPROVED_OR_LEGACY_ATTENDANCE_QUERY,
  })
    .select({ date: 1, records: 1 })
    .lean();

  const recordMap = new Map();
  docs.forEach((doc) => {
    const record = doc.records.find(
      (item) => String(item.studentId) === String(student._id),
    );
    if (record) {
      recordMap.set(doc.date, record.status);
    }
  });

  const monthsMap = new Map();
  const calendar = [];
  let cursor = ATTENDANCE_START_DATE;

  while (cursor <= calendarEndDate) {
    const monthKey = cursor.slice(0, 7);
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        monthKey,
        label: monthLabel(monthKey),
        workingDays: 0,
        markedDays: 0,
        present: 0,
        absent: 0,
        percentage: 0,
      });
    }

    const monthStats = monthsMap.get(monthKey);
    const recordStatus = recordMap.get(cursor);
    const holidayInfo = holidayMap.get(cursor);
    const holidayTitle = holidayInfo?.title;

    let status = "not_marked";
    let note = "";

    if (isWinterVacation(cursor)) {
      status = "vacation";
      note = "Winter vacation";
    } else if (holidayTitle) {
      status =
        holidayInfo?.eventType === "internship"
          ? "internship"
          : holidayInfo?.eventType === "event"
          ? "event"
          : "holiday";
      note = holidayTitle;
    } else if (isSunday(cursor)) {
      status = "holiday";
      note = "Sunday holiday";
    } else if (cursor > todayISO) {
      status = "future";
      note = "Upcoming day";
    } else {
      monthStats.workingDays += 1;

      if (recordStatus === "present") {
        status = "present";
        monthStats.markedDays += 1;
        monthStats.present += 1;
      } else if (recordStatus === "absent") {
        status = "absent";
        monthStats.markedDays += 1;
        monthStats.absent += 1;
      } else {
        note = "Attendance not marked";
      }
    }

    monthStats.percentage =
      monthStats.workingDays === 0
        ? 0
        : Number(
            ((monthStats.present / monthStats.workingDays) * 100).toFixed(1),
          );

    calendar.push({
      date: cursor,
      monthKey,
      day: Number(cursor.slice(8, 10)),
      dayOfWeek: parseISODate(cursor).getDay(),
      status,
      note,
    });

    cursor = addDays(cursor, 1);
  }

  const months = Array.from(monthsMap.values()).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey),
  );

  const overall = months.reduce(
    (acc, month) => {
      acc.workingDays += month.workingDays;
      acc.markedDays += month.markedDays;
      acc.present += month.present;
      acc.absent += month.absent;
      return acc;
    },
    {
      workingDays: 0,
      markedDays: 0,
      present: 0,
      absent: 0,
      percentage: 0,
    },
  );

  overall.percentage =
    overall.workingDays === 0
      ? 0
      : Number(((overall.present / overall.workingDays) * 100).toFixed(1));

  return {
    student: {
      _id: student._id,
      name: student.name,
      email: student.email,
      course: student.course,
      year: student.year,
      enrollmentNo: student.enrollmentNo,
    },
    startDate: ATTENDANCE_START_DATE,
    currentDate: todayISO,
    calendarEndDate,
    vacation: {
      from: WINTER_VACATION_FROM,
      to: WINTER_VACATION_TO,
    },
    customHolidays: Array.from(holidayMap.values()).map((holiday) => ({
      date: holiday.date,
      title: holiday.title,
      eventType: holiday.eventType || "holiday",
      fromDate: holiday.fromDate,
      toDate: holiday.toDate,
      scopeType: holiday.scopeType,
      course: holiday.course || "",
      year: holiday.year ?? null,
      studentId: holiday.studentId ?? null,
    })),
    resumeDate: COLLEGE_RESUME_DATE,
    overall,
    months,
    calendar,
  };
}

export async function GET(request) {
  try {
    await connectDB();

    const me = await getMeOrThrow(request);
    if (String(me?.role || "").toLowerCase() !== "faculty") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const view = searchParams.get("view");

    if (view !== "summary" || !studentId) {
      return NextResponse.json(
        { message: "Use ?view=summary&studentId=..." },
        { status: 400 },
      );
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
    })
      .select("name email enrollmentNo course year")
      .lean();

    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 },
      );
    }

    if (
      String(student.course || "").toUpperCase() !==
      String(me.assignedCourse || "").toUpperCase()
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const summary = await buildStudentAttendanceSummary(student);
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json(
      { message: e.message || "Server error" },
      { status: 500 },
    );
  }
}
