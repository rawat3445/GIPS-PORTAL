import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Attendance from "../../../models/Attendance";
import {
  addDays,
  ATTENDANCE_START_DATE,
  COLLEGE_RESUME_DATE,
  getHolidayMapForContext,
  isSunday,
  isWinterVacation,
  parseISODate,
  toISODate,
  WINTER_VACATION_FROM,
  WINTER_VACATION_TO,
} from "../../../lib/attendanceEvents";

function isWorkingDay(dateString, todayISO) {
  if (dateString < ATTENDANCE_START_DATE) return false;
  if (dateString > todayISO) return false;
  if (isWinterVacation(dateString)) return false;
  if (isSunday(dateString)) return false;
  return true;
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

async function getMe(request) {
  const res = await fetch(new URL("/api/auth/me", request.url), {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Unauthorized");
  }

  return data.user;
}

export async function GET(request) {
  try {
    await connectDB();

    const me = await getMe(request);
    if (String(me?.role || "").toLowerCase() !== "student") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const course = String(me?.course || "").toUpperCase();
    const year = Number(me?.year);
    const todayISO = toISODate(new Date());

    if (!course) {
      return NextResponse.json(
        { message: "Student course missing" },
        { status: 400 }
      );
    }

    if (!year) {
      return NextResponse.json(
        { message: "Student year missing" },
        { status: 400 }
      );
    }

    if (view === "summary") {
      const holidayMap = await getHolidayMapForContext({
        fromDate: ATTENDANCE_START_DATE,
        toDate: todayISO,
        course,
        year,
      });
      const docs = await Attendance.find({
        course,
        year,
        date: { $gte: ATTENDANCE_START_DATE, $lte: todayISO },
        "records.studentId": me._id,
      })
        .select({ date: 1, records: 1 })
        .lean();

      const recordMap = new Map();
      docs.forEach((doc) => {
        const record = doc.records.find(
          (item) => String(item.studentId) === String(me._id)
        );
        if (record) {
          recordMap.set(doc.date, record.status);
        }
      });

      const monthsMap = new Map();
      const calendar = [];
      let cursor = ATTENDANCE_START_DATE;

      while (cursor <= todayISO) {
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
        let dayType = "working";
        let note = "";

        if (isWinterVacation(cursor)) {
          status = "vacation";
          dayType = "vacation";
          note = "Winter vacation";
        } else if (holidayTitle) {
          status =
            holidayInfo?.eventType === "internship"
              ? "internship"
              : holidayInfo?.eventType === "event"
              ? "event"
              : "holiday";
          dayType = status;
          note = holidayTitle;
        } else if (isSunday(cursor)) {
          status = "holiday";
          dayType = "holiday";
          note = "Sunday holiday";
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
          type: dayType,
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

      return NextResponse.json({
        course,
        year,
        startDate: ATTENDANCE_START_DATE,
        currentDate: todayISO,
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
        })),
        resumeDate: COLLEGE_RESUME_DATE,
        rules: {
          sundaysAreHolidays: true,
          winterVacationExcluded: true,
          customHolidaysExcluded: true,
        },
        overall,
        months,
        calendar,
      });
    }

    if (date) {
      const doc = await Attendance.findOne({
        course,
        year,
        date,
        "records.studentId": me._id,
      }).lean();

      const record = doc?.records?.find(
        (r) => String(r.studentId) === String(me._id)
      );

      return NextResponse.json({
        course,
        year,
        date,
        status: record?.status || "not_marked",
      });
    }

    if (from && to) {
      const docs = await Attendance.find({
        course,
        year,
        date: { $gte: from, $lte: to },
        "records.studentId": me._id,
      })
        .select({ date: 1, records: 1 })
        .lean();

      const list = docs.map((d) => {
        const record = d.records.find(
          (r) => String(r.studentId) === String(me._id)
        );

        return {
          date: d.date,
          status: record?.status || "not_marked",
        };
      });

      return NextResponse.json({ course, year, from, to, list });
    }

    return NextResponse.json(
      {
        message:
          "Use ?view=summary OR ?date=YYYY-MM-DD OR ?from=YYYY-MM-DD&to=YYYY-MM-DD",
      },
      { status: 400 }
    );
  } catch (e) {
    return NextResponse.json(
      { message: e.message || "Server error" },
      { status: 500 }
    );
  }
}
