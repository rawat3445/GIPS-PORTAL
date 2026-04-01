import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Attendance from "../../../models/Attendance";
import Holiday from "../../../models/Holiday";
import User from "../../../models/User";
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

function buildAttendanceBadges({ bestStreak, currentStreak }) {
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

  const liveTierTarget =
    definitions.filter((badge) => currentStreak >= badge.target).at(-1)?.target ||
    null;

  return definitions.map((badge) => ({
    ...badge,
    progress: Number(badge.metric.toFixed(1)),
    unlocked: badge.metric >= badge.target,
    active: currentStreak >= badge.target,
    isCurrentTier: liveTierTarget === badge.target,
  }));
}

function getAttendanceTierDetails(overallPercentage) {
  if (overallPercentage >= 95) {
    return {
      tierLabel: "95% Club",
      tierTone: "rose",
      tierState: "excellent",
      tierIsLive: true,
    };
  }

  if (overallPercentage >= 90) {
    return {
      tierLabel: "90%+",
      tierTone: "indigo",
      tierState: "excellent",
      tierIsLive: true,
    };
  }

  if (overallPercentage >= 85) {
    return {
      tierLabel: "85%+",
      tierTone: "emerald",
      tierState: "strong",
      tierIsLive: true,
    };
  }

  if (overallPercentage >= 75) {
    return {
      tierLabel: "Safe Zone",
      tierTone: "sky",
      tierState: "safe",
      tierIsLive: true,
    };
  }

  return {
    tierLabel: "Attention",
    tierTone: "amber",
    tierState: "attention",
    tierIsLive: false,
  };
}

function getLeaderboardGroupKey(course, year) {
  return `${String(course || "").toUpperCase()}|${Number(year) || 0}`;
}

function getLeaderboardTitle(rank) {
  if (rank === 1) return "Legend";
  if (rank <= 5) return "Elite";
  if (rank <= 20) return "Active";
  return "Rising";
}

function formatPercentageLabel(value) {
  const numericValue = Number(value);
  return `${(Number.isFinite(numericValue) ? numericValue : 0).toFixed(1)}%`;
}

function buildLeaderboardMessage({
  rank,
  overallPercentage,
  standings,
}) {
  if (!Array.isArray(standings) || !standings.length) {
    return "Overall ranking will appear once attendance records are available.";
  }

  if (rank === 1) {
    return `You are leading the portal with ${formatPercentageLabel(
      overallPercentage,
    )} overall attendance.`;
  }

  const higherRankEntry = standings[Math.max(0, rank - 2)] || null;
  const attendanceGap =
    higherRankEntry && higherRankEntry.overallPercentage > overallPercentage
      ? Number(
          (higherRankEntry.overallPercentage - overallPercentage).toFixed(1),
        )
      : 0;

  if (attendanceGap > 0) {
    return `${formatPercentageLabel(
      overallPercentage,
    )} overall attendance. You are ${formatPercentageLabel(
      attendanceGap,
    )} behind the student just above you.`;
  }

  if (overallPercentage >= 75) {
    return `${formatPercentageLabel(
      overallPercentage,
    )} overall attendance keeps you above the 75% target. Keep going to climb higher.`;
  }

  return `${formatPercentageLabel(
    overallPercentage,
  )} overall attendance is below the 75% target. Consistent present days will help you recover and climb.`;
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

      const [holidayMap, docs, allStudents, allLeaderboardDocs, allLeaderboardHolidays] =
        await Promise.all([
          getHolidayMapForContext({
            fromDate: ATTENDANCE_START_DATE,
            toDate: calendarEndDate,
            course,
            year,
            studentId: me._id,
          }),
          Attendance.find({
            course,
            year,
            date: { $gte: ATTENDANCE_START_DATE, $lte: todayISO },
          })
            .select({ date: 1, records: 1 })
            .lean(),
          User.find({
            role: "student",
          })
            .select({ name: 1, profileImage: 1, course: 1, year: 1 })
            .sort({ name: 1 })
            .lean(),
          Attendance.find({
            date: { $gte: ATTENDANCE_START_DATE, $lte: todayISO },
          })
            .select({ course: 1, year: 1, date: 1, records: 1 })
            .lean(),
          Holiday.find({
            date: { $gte: ATTENDANCE_START_DATE, $lte: todayISO },
          })
            .select({
              date: 1,
              title: 1,
              eventType: 1,
              scopeType: 1,
              course: 1,
              year: 1,
              studentId: 1,
            })
            .lean(),
        ]);

      const recordMap = new Map();
      docs.forEach((doc) => {
        const record = doc.records.find(
          (item) => String(item.studentId) === String(me._id)
        );
        if (record) {
          recordMap.set(doc.date, record.status);
        }
      });

      const leaderboardRecordMap = new Map();
      allLeaderboardDocs.forEach((doc) => {
        const dailyRecordMap = new Map();
        (doc.records || []).forEach((record) => {
          dailyRecordMap.set(String(record.studentId), record.status);
        });
        leaderboardRecordMap.set(
          `${getLeaderboardGroupKey(doc.course, doc.year)}|${doc.date}`,
          dailyRecordMap,
        );
      });

      const leaderboardStudents = allStudents.filter((student) => {
        const studentCourse = String(student?.course || "").toUpperCase();
        const studentYear = Number(student?.year);
        return Boolean(studentCourse) && Number.isFinite(studentYear) && studentYear > 0;
      });
      const leaderboardStatsMap = new Map(
        leaderboardStudents.map((student) => [
          String(student._id),
          {
            studentId: String(student._id),
            name: student.name || "Student",
            profileImage: student.profileImage || "",
            course: String(student.course || "").toUpperCase(),
            year: Number(student.year) || 0,
            presentDays: 0,
            absentDays: 0,
            workingDays: 0,
          },
        ]),
      );
      const globalHolidayMap = new Map();
      const courseHolidayMap = new Map();
      const courseYearHolidayMap = new Map();
      const studentHolidayMap = new Map();

      allLeaderboardHolidays.forEach((holiday) => {
        const scopeType = String(holiday.scopeType || "global");
        const normalizedCourse = String(holiday.course || "").toUpperCase();
        const normalizedYear = Number(holiday.year) || 0;

        if (scopeType === "student" && holiday.studentId) {
          studentHolidayMap.set(
            `${String(holiday.studentId)}|${holiday.date}`,
            holiday,
          );
          return;
        }

        if (scopeType === "courseYear") {
          courseYearHolidayMap.set(
            `${getLeaderboardGroupKey(normalizedCourse, normalizedYear)}|${holiday.date}`,
            holiday,
          );
          return;
        }

        if (scopeType === "course") {
          courseHolidayMap.set(`${normalizedCourse}|${holiday.date}`, holiday);
          return;
        }

        globalHolidayMap.set(holiday.date, holiday);
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
        currentStreak: streaks.current,
      });

      let leaderboardCursor = ATTENDANCE_START_DATE;
      while (leaderboardCursor <= todayISO) {
        if (isWinterVacation(leaderboardCursor) || isSunday(leaderboardCursor)) {
          leaderboardCursor = addDays(leaderboardCursor, 1);
          continue;
        }

        leaderboardStudents.forEach((student) => {
          const studentId = String(student._id);
          const stats = leaderboardStatsMap.get(studentId);
          if (!stats) return;

          const groupKey = getLeaderboardGroupKey(stats.course, stats.year);
          const applicableHoliday =
            studentHolidayMap.get(`${studentId}|${leaderboardCursor}`) ||
            courseYearHolidayMap.get(`${groupKey}|${leaderboardCursor}`) ||
            courseHolidayMap.get(`${stats.course}|${leaderboardCursor}`) ||
            globalHolidayMap.get(leaderboardCursor);

          if (applicableHoliday) {
            return;
          }

          stats.workingDays += 1;

          const dailyRecords =
            leaderboardRecordMap.get(`${groupKey}|${leaderboardCursor}`) ||
            new Map();
          const status = dailyRecords.get(studentId);
          if (status === "present") {
            stats.presentDays += 1;
          } else if (status === "absent") {
            stats.absentDays += 1;
          }
        });

        leaderboardCursor = addDays(leaderboardCursor, 1);
      }

      const leaderboardEntries = leaderboardStudents
        .map((student) => {
          const studentId = String(student._id);
          const stats = leaderboardStatsMap.get(studentId) || {
            name: student.name || "Student",
            profileImage: student.profileImage || "",
            course: String(student.course || "").toUpperCase(),
            year: Number(student.year) || 0,
            presentDays: 0,
            absentDays: 0,
            workingDays: 0,
          };
          const overallPercentage =
            stats.workingDays === 0
              ? 0
              : Number(((stats.presentDays / stats.workingDays) * 100).toFixed(1));

          return {
            studentId,
            name: stats.name,
            profileImage: stats.profileImage,
            course: stats.course,
            year: stats.year,
            overallPercentage,
            presentDays: stats.presentDays,
            absentDays: stats.absentDays,
            workingDays: stats.workingDays,
            isCurrentUser: studentId === String(me._id),
          };
        })
        .sort(
          (a, b) =>
            b.overallPercentage - a.overallPercentage ||
            b.presentDays - a.presentDays ||
            a.name.localeCompare(b.name)
        )
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
          title: getLeaderboardTitle(index + 1),
        }));

      const toPublicLeaderboardEntry = (entry) => ({
        studentId: entry.studentId,
        name: entry.name,
        profileImage: entry.profileImage,
        course: entry.course,
        year: entry.year,
        isCurrentUser: entry.isCurrentUser,
        rank: entry.rank,
        title: entry.title,
        overallPercentage: entry.overallPercentage,
        presentDays: entry.presentDays,
        absentDays: entry.absentDays,
        workingDays: entry.workingDays,
        ...getAttendanceTierDetails(entry.overallPercentage),
      });

      const currentUserRanking =
        leaderboardEntries.find((entry) => entry.isCurrentUser) || null;
      const currentUserIndex = leaderboardEntries.findIndex(
        (entry) => entry.isCurrentUser
      );
      const nearbyStart =
        currentUserIndex < 0 ? 0 : Math.max(0, currentUserIndex - 2);
      const nearbyEnd =
        currentUserIndex < 0
          ? Math.min(5, leaderboardEntries.length)
          : Math.min(leaderboardEntries.length, nearbyStart + 5);
      const normalizedNearbyStart = Math.max(0, nearbyEnd - 5);
      const higherRankEntry =
        currentUserIndex > 0 ? leaderboardEntries[currentUserIndex - 1] : null;

      const leaderboard = {
        scope: "overallAttendance",
        totalStudents: leaderboardEntries.length,
        yourRank: currentUserRanking?.rank ?? null,
        yourTitle: currentUserRanking?.title || getLeaderboardTitle(1),
        yourOverallPercentage:
          currentUserRanking?.overallPercentage ?? overall.percentage,
        yourPresentDays: currentUserRanking?.presentDays ?? overall.present,
        yourAbsentDays: currentUserRanking?.absentDays ?? overall.absent,
        yourWorkingDays: currentUserRanking?.workingDays ?? overall.workingDays,
        gapToNextRank:
          currentUserRanking && higherRankEntry
            ? Number(
                Math.max(
                  0,
                  higherRankEntry.overallPercentage -
                    currentUserRanking.overallPercentage,
                ).toFixed(1),
              )
            : 0,
        motivation: buildLeaderboardMessage({
          rank: currentUserRanking?.rank ?? 1,
          overallPercentage:
            currentUserRanking?.overallPercentage ?? overall.percentage,
          standings: leaderboardEntries,
        }),
        topStudents: leaderboardEntries.slice(0, 5).map(toPublicLeaderboardEntry),
        nearbyStudents: leaderboardEntries
          .slice(normalizedNearbyStart, nearbyEnd)
          .map(toPublicLeaderboardEntry),
      };

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
        leaderboard,
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
