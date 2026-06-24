import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "../../../lib/db";
import Attendance from "../../../models/Attendance";
import User from "../../../models/User";
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
} from "../../../lib/attendanceEvents";
import { logActivity } from "../../../lib/activity";

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
      (item) => String(item.studentId) === String(student._id)
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
            ((monthStats.present / monthStats.workingDays) * 100).toFixed(1)
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
    a.monthKey.localeCompare(b.monthKey)
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
    }
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

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (String(decoded.role || "").toLowerCase() !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const course = (searchParams.get("course") || "").toUpperCase();
    const year = searchParams.get("year");
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const studentId = searchParams.get("studentId");
    const view = searchParams.get("view");
    const status = String(searchParams.get("status") || "").trim().toLowerCase();

    if (view === "summary" && studentId) {
      const student = await User.findOne({
        _id: studentId,
        role: "student",
      })
        .select("name email course year")
        .lean();

      if (!student) {
        return NextResponse.json(
          { message: "Student not found" },
          { status: 404 }
        );
      }

      const summary = await buildStudentAttendanceSummary(student);
      return NextResponse.json(summary);
    }

    const query = {};

    if (course) query.course = course;
    if (year) query.year = Number(year);

    if (date) {
      query.date = date;
    } else if (from && to) {
      query.date = { $gte: from, $lte: to };
    }

    if (status === "pending" || status === "approved" || status === "denied") {
      query.approvalStatus = status;
    }

    const attendance = await Attendance.find(query)
      .populate("records.studentId", "name email course year")
      .populate("markedBy", "name email")
      .populate("reviewedBy", "name email")
      .sort({ date: -1, course: 1, year: 1 })
      .lean();

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (String(decoded.role || "").toLowerCase() !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await req.json().catch(() => ({}));
    const attendanceId = String(body?.attendanceId || "").trim();
    const decision = String(body?.decision || "").trim().toLowerCase();
    const reviewNote = String(body?.reviewNote || "").trim();

    if (!attendanceId || !["approve", "deny"].includes(decision)) {
      return NextResponse.json(
        { message: "attendanceId and valid decision are required" },
        { status: 400 },
      );
    }

    const adminUser = await User.findById(decoded.id)
      .select("name email role")
      .lean();

    const nextStatus = decision === "approve" ? "approved" : "denied";
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        $set: {
          approvalStatus: nextStatus,
          reviewedBy: decoded.id,
          reviewedAt: new Date(),
          reviewNote,
        },
      },
      { new: true },
    )
      .populate("markedBy", "name email role")
      .populate("reviewedBy", "name email role")
      .lean();

    if (!attendance) {
      return NextResponse.json({ message: "Attendance not found" }, { status: 404 });
    }

    await logActivity({
      actor: adminUser,
      actionType: decision === "approve" ? "attendance_approved" : "attendance_denied",
      actionLabel: decision === "approve" ? "Approved attendance" : "Denied attendance",
      target: attendance.markedBy || null,
      path: "/dashboard/admin/attendance",
      details: [
        `${decision === "approve" ? "Approved" : "Denied"} ${attendance.course} Year ${attendance.year} attendance for ${attendance.date}`,
        `Faculty: ${attendance.markedBy?.name || "Unknown"}`,
        reviewNote ? `Note: ${reviewNote}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
      metadata: {
        attendanceId: attendance._id,
        course: attendance.course,
        year: attendance.year,
        date: attendance.date,
        approvalStatus: nextStatus,
        reviewNote,
        recordCount: Array.isArray(attendance.records) ? attendance.records.length : 0,
      },
    });

    return NextResponse.json({
      message:
        decision === "approve"
          ? "Attendance approved successfully"
          : "Attendance denied successfully",
      attendance,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
