import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Attendance from "../../../models/Attendance";
import {
  addDays,
  ATTENDANCE_START_DATE,
  COLLEGE_RESUME_DATE,
  findApplicableHoliday,
  getCalendarEndDateForContext,
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

function calculateStreaks(timeline) {
  let current = 0;
  let best = 0;
  let running = 0;
  let lastRelevantDay = null;
  let lastRelevantStatus = null;
  let lastConfirmedDay = null;
  let lastConfirmedStatus = null;

  for (const day of timeline) {
    if (day.status === "present") {
      running += 1;
      if (running > best) best = running;
      lastRelevantDay = day.date;
      lastRelevantStatus = "present";
      lastConfirmedDay = day.date;
      lastConfirmedStatus = "present";
    } else if (day.status === "absent") {
      running = 0;
      lastRelevantDay = day.date;
      lastRelevantStatus = "absent";
      lastConfirmedDay = day.date;
      lastConfirmedStatus = "absent";
    }
  }

  let currentEndDate = null;
  let currentStartDate = null;
  let lastConfirmedIndex = -1;

  for (let index = timeline.length - 1; index >= 0; index -= 1) {
    if (
      timeline[index].status === "present" ||
      timeline[index].status === "absent"
    ) {
      lastConfirmedIndex = index;
      break;
    }
  }

  if (lastConfirmedIndex >= 0 && timeline[lastConfirmedIndex].status === "present") {
    currentEndDate = timeline[lastConfirmedIndex].date;

    for (let index = lastConfirmedIndex; index >= 0; index -= 1) {
      if (timeline[index].status === "not_marked") {
        continue;
      }

      if (timeline[index].status !== "present") {
        break;
      }

      currentStartDate = timeline[index].date;
      current += 1;
    }
  }

  return {
    current,
    best,
    lastWorkingDay: timeline.at(-1)?.date || null,
    lastWorkingStatus: timeline.at(-1)?.status || null,
    lastRelevantDay,
    lastRelevantStatus,
    lastConfirmedDay,
    lastConfirmedStatus,
    currentStartDate: current ? currentStartDate : null,
    currentEndDate: current ? currentEndDate : null,
  };
}

function buildStreakProgress(streaks) {
  const milestones = [3, 6, 10, 15, 25];
  const current = Number(streaks?.current || 0);
  const nextTarget = milestones.find((target) => current < target) || null;
  const previousTarget =
    milestones.filter((target) => target <= current).at(-1) || 0;
  const target = nextTarget || milestones.at(-1);
  const percent = target
    ? Number(((Math.min(current, target) / target) * 100).toFixed(1))
    : 0;

  let message = "Start attending regularly this month to build your streak.";

  if (nextTarget) {
    message = `${nextTarget - current} more working day${
      nextTarget - current === 1 ? "" : "s"
    } to unlock the ${nextTarget}-day streak tier this month.`;
  } else {
    message = "Premium monthly streak tier reached. Keep going to protect your run.";
  }

  if (current === 0 && streaks?.lastRelevantStatus === "absent") {
    message =
      "An absence on the last confirmed working day reset this month's live streak to zero.";
  } else if (!streaks?.lastRelevantStatus) {
    message =
      "This month's live streak is waiting for the next confirmed present day.";
  } else if (current > 0 && streaks?.lastWorkingStatus === "not_marked") {
    message = `${nextTarget ? `${nextTarget - current} more working day${
      nextTarget - current === 1 ? "" : "s"
    } to unlock the ${nextTarget}-day streak tier this month.` : "Premium monthly streak tier reached. Keep going to protect your run."} Recent working days are not marked yet, so your streak is still active.`;
  }

  return {
    current,
    previousTarget,
    target,
    nextTarget,
    percent,
    message,
    resetsOnAbsent: true,
  };
}

function buildAttendanceBadges({ bestStreak }) {
  const definitions = [
    {
      key: "amber-ember",
      title: "Amber Ember",
      description: "Build a 2-day streak in the current month.",
      tone: "amber",
      icon: "flame",
      metric: bestStreak,
      target: 2,
    },
    {
      key: "sky-surge",
      title: "Sky Surge",
      description: "Reach a 3-day monthly streak.",
      tone: "sky",
      icon: "flame",
      metric: bestStreak,
      target: 3,
    },
    {
      key: "violet-rhythm",
      title: "Violet Rhythm",
      description: "Hold a 6-day streak in the current month.",
      tone: "violet",
      icon: "flame",
      metric: bestStreak,
      target: 6,
    },
    {
      key: "emerald-core",
      title: "Emerald Core",
      description: "Reach a 10-day streak in the current month.",
      tone: "emerald",
      icon: "award",
      metric: bestStreak,
      target: 10,
    },
    {
      key: "indigo-elite",
      title: "Indigo Elite",
      description: "Push your current month streak to 15 days.",
      tone: "indigo",
      icon: "award",
      metric: bestStreak,
      target: 15,
    },
    {
      key: "rose-crown",
      title: "Rose Crown",
      description: "Reach the 25-day premium streak tier this month.",
      tone: "rose",
      icon: "trophy",
      metric: bestStreak,
      target: 25,
    },
  ];

  return definitions.map((badge) => ({
    ...badge,
    progress: Number(badge.metric.toFixed(1)),
    unlocked: badge.metric >= badge.target,
  }));
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
    const currentMonthKey = todayISO.slice(0, 7);

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
      const calendarEndDate = await getCalendarEndDateForContext({
        course,
        year,
        studentId: me._id,
      });

      const holidayMap = await getHolidayMapForContext({
        fromDate: ATTENDANCE_START_DATE,
        toDate: calendarEndDate,
        course,
        year,
        studentId: me._id,
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
      const streakTimeline = [];
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
        } else if (cursor > todayISO) {
          status = "future";
          dayType = "future";
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

          if (monthKey === currentMonthKey) {
            streakTimeline.push({
              date: cursor,
              status,
            });
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

      const streaks = calculateStreaks(streakTimeline);
      const streakProgress = buildStreakProgress(streaks);
      const badges = buildAttendanceBadges({
        bestStreak: streaks.best,
      });

      return NextResponse.json({
        course,
        year,
        streakMonthKey: currentMonthKey,
        streakMonthLabel: monthLabel(currentMonthKey),
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
        rules: {
          sundaysAreHolidays: true,
          winterVacationExcluded: true,
          customHolidaysExcluded: true,
        },
        overall,
        streaks,
        streakProgress,
        badges,
        months,
        calendar,
      });
    }

    if (date) {
      const eventInfo = await findApplicableHoliday({
        date,
        course,
        year,
        studentId: me._id,
      });

      if (eventInfo) {
        return NextResponse.json({
          course,
          year,
          date,
          status:
            eventInfo.eventType === "internship"
              ? "internship"
              : eventInfo.eventType === "event"
              ? "event"
              : "holiday",
          event: {
            title: eventInfo.title,
            eventType: eventInfo.eventType || "holiday",
            scopeType: eventInfo.scopeType,
            course: eventInfo.course || "",
            year: eventInfo.year ?? null,
            studentId: eventInfo.studentId ?? null,
          },
        });
      }

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
