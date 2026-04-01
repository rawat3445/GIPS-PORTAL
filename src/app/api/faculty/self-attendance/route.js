import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import FacultyAttendance from "../../../models/FacultyAttendance";
import {
  addDays,
  getHolidayMapForContext,
  isSunday,
  isWinterVacation,
  toISODate,
} from "../../../lib/attendanceEvents";

function getMonthRange(date = new Date()) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    from: toISODate(first),
    to: toISODate(last),
    label: first.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    }),
  };
}

function parseMonthValue(monthValue) {
  const value = String(monthValue || "").trim();
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return new Date();
  }

  const parsedDate = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

async function requireFacultyUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { ok: false };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (String(decoded?.role || "").toLowerCase() !== "faculty") {
      return { ok: false };
    }

    await connectDB();

    const user = await User.findById(decoded.id)
      .select(
        "name email role facultyType designation assignedCourse phone profileImage",
      )
      .lean();

    if (!user) {
      return { ok: false };
    }

    return { ok: true, user };
  } catch {
    return { ok: false };
  }
}

export async function GET(req) {
  const auth = await requireFacultyUser();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const monthDate = parseMonthValue(searchParams.get("month"));
    const { from, to, label } = getMonthRange(monthDate);
    const userId = String(auth.user._id);
    const todayISO = toISODate(new Date());

    const [docs, holidayMap] = await Promise.all([
      // Read the full month range and match records in JS so both legacy
      // string ids and current ObjectId ids are picked up consistently.
      FacultyAttendance.find({
        date: { $gte: from, $lte: to },
      })
        .select("date records")
        .sort({ date: -1 })
        .lean(),
      getHolidayMapForContext({
        fromDate: from,
        toDate: to,
      }),
    ]);

    const attendanceRecordMap = new Map();
    docs.forEach((doc) => {
      const record = (doc.records || []).find(
        (item) => String(item.facultyId) === userId,
      );

      if (record) {
        attendanceRecordMap.set(doc.date, record.status);
      }
    });

    const records = [];
    const calendar = [];
    let present = 0;
    let absent = 0;
    let leave = 0;
    let holidayDays = 0;
    let cursor = from;

    while (cursor <= to) {
      const holidayInfo = holidayMap.get(cursor);
      let status = "not_marked";
      let note = "";

      if (cursor > todayISO) {
        status = "future";
        note = "Upcoming day";
      } else if (attendanceRecordMap.has(cursor)) {
        status = attendanceRecordMap.get(cursor);
      } else if (isWinterVacation(cursor)) {
        status = "vacation";
        note = "Winter vacation";
        holidayDays += 1;
      } else if (holidayInfo) {
        status =
          holidayInfo.eventType === "internship"
            ? "internship"
            : holidayInfo.eventType === "event"
              ? "event"
              : "holiday";
        note = holidayInfo.title || "Holiday";
        holidayDays += 1;
      } else if (isSunday(cursor)) {
        status = "holiday";
        note = "Sunday holiday";
        holidayDays += 1;
      }

      if (status === "present") {
        present += 1;
        records.push({ date: cursor, status });
      } else if (status === "absent") {
        absent += 1;
        records.push({ date: cursor, status });
      } else if (status === "leave") {
        leave += 1;
        records.push({ date: cursor, status });
      } else if (status === "holiday") {
        records.push({ date: cursor, status });
      }

      calendar.push({
        date: cursor,
        status,
        note,
      });

      cursor = addDays(cursor, 1);
    }

    const workingDays = present + absent;
    const attendanceRate =
      workingDays === 0 ? 0 : Number(((present / workingDays) * 100).toFixed(1));

    return NextResponse.json({
      faculty: {
        _id: userId,
        name: auth.user.name || "",
        email: auth.user.email || "",
        facultyType:
          String(auth.user.facultyType || "").trim() === "nonTeaching"
            ? "nonTeaching"
            : "teaching",
        designation: auth.user.designation || "",
        assignedCourse: auth.user.assignedCourse || "",
        phone: auth.user.phone || "",
        profileImage: auth.user.profileImage || "",
      },
      month: {
        value: from.slice(0, 7),
        label,
        from,
        to,
      },
      summary: {
        markedDays: records.length,
        present,
        absent,
        leave,
        holidayDays,
        attendanceRate,
      },
      calendar,
      records,
    });
  } catch (error) {
    console.error("FACULTY SELF ATTENDANCE ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
