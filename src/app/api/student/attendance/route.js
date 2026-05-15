import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Attendance from "../../../models/Attendance";
import Holiday from "../../../models/Holiday";
import ResultPointAssignment from "../../../models/ResultPointAssignment";
import StudentClassTest from "../../../models/StudentClassTest";
import StudentPersonalityProfile from "../../../models/StudentPersonalityProfile";
import StudentResult from "../../../models/StudentResult";
import User from "../../../models/User";
import { buildClassTestsCategory } from "../../../lib/classTests";
import { buildPersonalitySummary } from "../../../lib/personalityDevelopment";
import { TOTAL_STUDENT_POINTS } from "../../../lib/studentResume";
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

const APPROVED_OR_LEGACY_ATTENDANCE_QUERY = [
  { approvalStatus: "approved" },
  { approvalStatus: { $exists: false } },
];

const POINTS_START_DATE = "2026-04-01";
const POINTS_START_MONTH_KEY = POINTS_START_DATE.slice(0, 7);
const RESULT_CATEGORY_MAX_POINTS = 25;
const RESULT_PERCENTAGE_MAX_POINTS = 15;
const RESULT_PASS_BONUS_MAX_POINTS = 5;
const RESULT_PERFORMANCE_BONUS_MAX_POINTS = 5;
const ENABLE_PERSONALITY_POINTS_IN_FRAMEWORK = false;

function getFrameworkPersonalityPoints(personalityDevelopment) {
  if (!ENABLE_PERSONALITY_POINTS_IN_FRAMEWORK) {
    return 0;
  }

  return Number(personalityDevelopment?.score?.totalPoints || 0);
}

function getResultPerformanceBonus(percentage) {
  const value = Number(percentage || 0);

  if (value >= 90) return 5;
  if (value >= 80) return 4;
  if (value >= 70) return 3;
  if (value >= 60) return 2;
  if (value >= 50) return 1;
  return 0;
}

function getResultIssueLabels(subjects) {
  return (Array.isArray(subjects) ? subjects : []).flatMap((subject) => {
    const subjectCode = String(subject?.subjectCode || "").trim() || "Subject";
    const issueLabels = [];
    const theoryStatus = String(subject?.theoryResultStatus || "").toLowerCase();
    const practicalStatus = String(subject?.practicalResultStatus || "").toLowerCase();
    const subjectStatus = String(subject?.subjectStatus || "").toLowerCase();
    const hasTheory = Boolean(subject?.hasTheory ?? Number(subject?.theoryMax || 0) > 0);
    const hasPractical = Boolean(
      subject?.hasPractical ?? Number(subject?.practicalMax || 0) > 0,
    );

    if (hasTheory && ["fail", "bp", "absent"].includes(theoryStatus)) {
      issueLabels.push(`${subjectCode} Theory ${theoryStatus.toUpperCase()}`);
    }

    if (hasPractical && ["fail", "bp", "absent"].includes(practicalStatus)) {
      issueLabels.push(`${subjectCode} Practical ${practicalStatus.toUpperCase()}`);
    }

    if (
      issueLabels.length === 0 &&
      ["fail", "bp", "absent"].includes(subjectStatus)
    ) {
      issueLabels.push(`${subjectCode} ${subjectStatus.toUpperCase()}`);
    }

    return issueLabels;
  });
}

function buildResultCategory(selectedResult, studentId, assignment = null) {
  const studentEntry = (selectedResult?.students || []).find(
    (entry) => String(entry?.studentId) === String(studentId),
  );
  const assignmentStatus = assignment?.resultId
    ? studentEntry
      ? "assigned"
      : "assigned_but_student_missing"
    : "not_assigned";

  if (!selectedResult || !studentEntry) {
    return {
      hasPublishedResult: false,
      assignmentStatus,
      totalPoints: 0,
      maxPoints: RESULT_CATEGORY_MAX_POINTS,
      percentagePoints: 0,
      percentageMax: RESULT_PERCENTAGE_MAX_POINTS,
      passBonusPoints: 0,
      passBonusMax: RESULT_PASS_BONUS_MAX_POINTS,
      performanceBonusPoints: 0,
      performanceBonusMax: RESULT_PERFORMANCE_BONUS_MAX_POINTS,
      latestResultName: safeString(assignment?.resultName),
      latestPercentage: 0,
      latestResultStatus: "pending",
      publishedAt: null,
      issueLabels: [],
      issueCount: 0,
    };
  }

  const percentage = Number(studentEntry?.percentage || 0);
  const resultStatus = String(studentEntry?.resultStatus || "pending").toLowerCase();
  const issueLabels = getResultIssueLabels(studentEntry?.subjects || []);
  const percentagePoints = Math.min(
    RESULT_PERCENTAGE_MAX_POINTS,
    Math.max(0, Math.round((percentage / 100) * RESULT_PERCENTAGE_MAX_POINTS)),
  );
  const passBonusPoints =
    resultStatus === "pass" && issueLabels.length === 0
      ? RESULT_PASS_BONUS_MAX_POINTS
      : 0;
  const performanceBonusPoints = getResultPerformanceBonus(percentage);
  const totalPoints = Math.min(
    RESULT_CATEGORY_MAX_POINTS,
    percentagePoints + passBonusPoints + performanceBonusPoints,
  );

  return {
    hasPublishedResult: true,
    assignmentStatus,
    totalPoints,
    maxPoints: RESULT_CATEGORY_MAX_POINTS,
    percentagePoints,
    percentageMax: RESULT_PERCENTAGE_MAX_POINTS,
    passBonusPoints,
    passBonusMax: RESULT_PASS_BONUS_MAX_POINTS,
    performanceBonusPoints,
    performanceBonusMax: RESULT_PERFORMANCE_BONUS_MAX_POINTS,
    latestResultName: String(selectedResult?.resultName || "").trim(),
    latestPercentage: Number(percentage.toFixed(2)),
    latestResultStatus: resultStatus,
    publishedAt: selectedResult?.publishedAt || selectedResult?.createdAt || null,
    issueLabels,
    issueCount: issueLabels.length,
  };
}

function safeString(value) {
  return String(value || "").trim();
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

function getApplicableLeaderboardHoliday({
  studentId,
  course,
  year,
  date,
  globalHolidayMap,
  courseHolidayMap,
  courseYearHolidayMap,
  studentHolidayMap,
}) {
  const normalizedStudentId = String(studentId || "");
  const normalizedCourse = String(course || "").toUpperCase();
  const normalizedYear = Number(year) || 0;
  const groupKey = getLeaderboardGroupKey(normalizedCourse, normalizedYear);

  return (
    studentHolidayMap.get(`${normalizedStudentId}|${date}`) ||
    courseYearHolidayMap.get(`${groupKey}|${date}`) ||
    courseHolidayMap.get(`${normalizedCourse}|${date}`) ||
    globalHolidayMap.get(date) ||
    null
  );
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

function calculateConfirmedPercentage(presentDays, absentDays) {
  const present = Number(presentDays || 0);
  const absent = Number(absentDays || 0);
  const markedDays = present + absent;

  if (!markedDays) {
    return 0;
  }

  return Number(((present / markedDays) * 100).toFixed(1));
}

function calculateWorkingDayPercentage(presentDays, workingDays) {
  const present = Number(presentDays || 0);
  const totalWorkingDays = Number(workingDays || 0);

  if (!totalWorkingDays) {
    return 0;
  }

  return Number(((present / totalWorkingDays) * 100).toFixed(1));
}

function getMonthEndDate(dateString) {
  const date = parseISODate(dateString);
  return toISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function countWorkingDaysInRange({ fromDate, toDate, isExcluded = () => false }) {
  if (!fromDate || !toDate || fromDate > toDate) {
    return 0;
  }

  let total = 0;
  let cursor = fromDate;

  while (cursor <= toDate) {
    if (!isWinterVacation(cursor) && !isSunday(cursor) && !isExcluded(cursor)) {
      total += 1;
    }

    cursor = addDays(cursor, 1);
  }

  return total;
}

function getCurrentMonthFutureWorkingDays({
  monthKey,
  currentMonthKey,
  todayISO,
  monthEndDate,
  isExcluded = () => false,
}) {
  if (!monthKey || monthKey !== currentMonthKey) {
    return 0;
  }

  return countWorkingDaysInRange({
    fromDate: addDays(todayISO, 1),
    toDate: monthEndDate,
    isExcluded,
  });
}

function getPointsMonths(months) {
  return (Array.isArray(months) ? months : []).filter(
    (month) => String(month?.monthKey || "") >= POINTS_START_MONTH_KEY,
  );
}

function summarizeMonthlyAttendance(months) {
  return (Array.isArray(months) ? months : []).reduce(
    (acc, month) => {
      acc.present += Number(month?.present || 0);
      acc.absent += Number(month?.absent || 0);
      acc.workingDays += Number(month?.workingDays || 0);
      return acc;
    },
    {
      present: 0,
      absent: 0,
      workingDays: 0,
    },
  );
}

function buildPointsMonthSummary(month, futureWorkingDays = 0) {
  const present = Number(month?.present || 0);
  const absent = Number(month?.absent || 0);
  const markedDays = Number(month?.markedDays || present + absent);
  const workingDays = Number(month?.workingDays || 0) + Number(futureWorkingDays || 0);
  const scoringPercentage = calculateWorkingDayPercentage(present, workingDays);

  return {
    ...month,
    present,
    absent,
    markedDays,
    workingDays,
    confirmedMarkedDays: workingDays,
    confirmedPercentage: scoringPercentage,
    scoringWorkingDays: workingDays,
    scoreBonus: getMonthlyAttendanceScoreBonus(scoringPercentage),
  };
}

function buildPointsMonths(months, scoringContext) {
  return getPointsMonths(months).map((month) =>
    buildPointsMonthSummary(
      month,
      getCurrentMonthFutureWorkingDays({
        monthKey: month.monthKey,
        ...scoringContext,
      }),
    ),
  );
}

function getMonthlyAttendanceScoreBonus(confirmedPercentage) {
  if (confirmedPercentage >= 95) {
    return 20;
  }

  if (confirmedPercentage >= 90) {
    return 15;
  }

  if (confirmedPercentage >= 85) {
    return 10;
  }

  if (confirmedPercentage >= 75) {
    return 5;
  }

  return 0;
}

function getStreakAttendanceScoreBonus(bestStreak) {
  const streak = Number(bestStreak || 0);

  if (streak >= 25) {
    return 50;
  }

  if (streak >= 15) {
    return 30;
  }

  if (streak >= 10) {
    return 20;
  }

  if (streak >= 6) {
    return 10;
  }

  if (streak >= 3) {
    return 5;
  }

  return 0;
}

function buildAttendanceScore({
  presentDays,
  absentDays,
  monthlyBonuses,
  bestStreak,
}) {
  const confirmedPercentage = calculateConfirmedPercentage(
    presentDays,
    absentDays,
  );
  const baseScore = Math.round(confirmedPercentage);
  const monthlyBonusTotal = Array.isArray(monthlyBonuses)
    ? monthlyBonuses.reduce((sum, bonus) => sum + Number(bonus || 0), 0)
    : 0;
  const streakBonus = getStreakAttendanceScoreBonus(bestStreak);

  return {
    confirmedPercentage,
    confirmedMarkedDays: Number(presentDays || 0) + Number(absentDays || 0),
    baseScore,
    monthlyBonusTotal,
    streakBonus,
    totalScore: baseScore + monthlyBonusTotal + streakBonus,
  };
}

function buildPointsAttendanceScore({
  presentDays,
  workingDays,
  monthlyBonuses,
  bestStreak,
}) {
  const scoringPercentage = calculateWorkingDayPercentage(presentDays, workingDays);
  const baseScore = Math.round(scoringPercentage);
  const monthlyBonusTotal = Array.isArray(monthlyBonuses)
    ? monthlyBonuses.reduce((sum, bonus) => sum + Number(bonus || 0), 0)
    : 0;
  const streakBonus = getStreakAttendanceScoreBonus(bestStreak);

  return {
    confirmedPercentage: scoringPercentage,
    confirmedMarkedDays: Number(workingDays || 0),
    workingDays: Number(workingDays || 0),
    baseScore,
    monthlyBonusTotal,
    streakBonus,
    totalScore: baseScore + monthlyBonusTotal + streakBonus,
  };
}

function getAttendanceCategoryCoveragePoints(confirmedPercentage) {
  const coverage = Number(confirmedPercentage || 0);
  return Math.min(15, Math.max(0, Math.round((coverage / 100) * 15)));
}

function getAttendanceCategoryStreakPoints(bestStreak) {
  const streak = Number(bestStreak || 0);

  if (streak >= 25) {
    return 5;
  }

  if (streak >= 15) {
    return 4;
  }

  if (streak >= 10) {
    return 3;
  }

  if (streak >= 6) {
    return 2;
  }

  if (streak >= 3) {
    return 1;
  }

  return 0;
}

function buildAttendanceCategoryScore({
  confirmedPercentage,
  bonusMonthsCount,
  bestStreak,
}) {
  const coveragePoints = getAttendanceCategoryCoveragePoints(confirmedPercentage);
  const normalizedBonusMonthsCount = Math.max(
    0,
    Math.round(Number(bonusMonthsCount || 0)),
  );
  const monthlyConsistencyPoints = Math.min(5, normalizedBonusMonthsCount);
  const streakPoints = getAttendanceCategoryStreakPoints(bestStreak);

  return {
    coveragePoints,
    coverageMax: 15,
    monthlyConsistencyPoints,
    monthlyConsistencyMax: 5,
    streakPoints,
    streakMax: 5,
    bonusMonthsCount: normalizedBonusMonthsCount,
    bestStreak: Number(bestStreak || 0),
    totalPoints: coveragePoints + monthlyConsistencyPoints + streakPoints,
    maxPoints: 25,
  };
}

function buildLeaderboardMessage({
  rank,
  attendanceScore,
  confirmedOverallPercentage,
  standings,
}) {
  if (!Array.isArray(standings) || !standings.length) {
    return "Current live attendance ranking will appear once attendance records are available.";
  }

  if (rank === 1) {
    return `You are leading the current live attendance ranking with ${attendanceScore} attendance-category points and ${formatPercentageLabel(
      confirmedOverallPercentage,
    )} attendance coverage against total working days.`;
  }

  const higherRankEntry = standings[Math.max(0, rank - 2)] || null;
  const scoreGap =
    higherRankEntry && higherRankEntry.attendanceScore > attendanceScore
      ? higherRankEntry.attendanceScore - attendanceScore
      : 0;

  if (scoreGap > 0) {
    return `${attendanceScore} live attendance points with ${formatPercentageLabel(
      confirmedOverallPercentage,
    )} attendance coverage. You are ${scoreGap} point${
      scoreGap === 1 ? "" : "s"
    } behind the student just above you in the current live ranking.`;
  }

  if (confirmedOverallPercentage >= 75) {
    return `${attendanceScore} live attendance points and ${formatPercentageLabel(
      confirmedOverallPercentage,
    )} attendance coverage keep you above the 75% target. Keep going while the full 100-point system rolls out.`;
  }

  return `${attendanceScore} live attendance points with ${formatPercentageLabel(
    confirmedOverallPercentage,
  )} attendance coverage is below the 75% target. Consistent present days will help you recover and climb in the live ranking.`;
}

function buildOverallPointsLeaderboardMessage({
  rank,
  overallFrameworkPoints,
  overallFrameworkMaxPoints,
  standings,
  liveCategoryCount,
}) {
  if (!Array.isArray(standings) || !standings.length) {
    return "Overall student-points ranking will appear once enough scored records are available.";
  }

  if (rank === 1) {
    return `You are leading the overall student-points ranking with ${overallFrameworkPoints}/${overallFrameworkMaxPoints} points across ${liveCategoryCount} live categor${
      liveCategoryCount === 1 ? "y" : "ies"
    }.`;
  }

  const higherRankEntry = standings[Math.max(0, rank - 2)] || null;
  const scoreGap =
    higherRankEntry &&
    Number(higherRankEntry.overallFrameworkPoints || 0) > overallFrameworkPoints
      ? Number(higherRankEntry.overallFrameworkPoints || 0) -
        overallFrameworkPoints
      : 0;

  if (scoreGap > 0) {
    return `${overallFrameworkPoints}/${overallFrameworkMaxPoints} overall student points across ${liveCategoryCount} live categor${
      liveCategoryCount === 1 ? "y" : "ies"
    }. You are ${scoreGap} point${
      scoreGap === 1 ? "" : "s"
    } behind the student just above you.`;
  }

  return `${overallFrameworkPoints}/${overallFrameworkMaxPoints} overall student points are now driving this ranking. More live categories will make the board more competitive over time.`;
}

function buildAttendanceLeaderboardMessage({
  rank,
  confirmedOverallPercentage,
  standings,
}) {
  if (!Array.isArray(standings) || !standings.length) {
    return "Current live attendance ranking will appear once attendance records are available.";
  }

  if (rank === 1) {
    return `You are leading the current live attendance ranking with ${formatPercentageLabel(
      confirmedOverallPercentage,
    )} confirmed attendance.`;
  }

  const higherRankEntry = standings[Math.max(0, rank - 2)] || null;
  const attendanceGap =
    higherRankEntry &&
    higherRankEntry.confirmedOverallPercentage > confirmedOverallPercentage
      ? Number(
          (
            higherRankEntry.confirmedOverallPercentage -
            confirmedOverallPercentage
          ).toFixed(1),
        )
      : 0;

  if (attendanceGap > 0) {
    return `${formatPercentageLabel(
      confirmedOverallPercentage,
    )} confirmed attendance. You are ${formatPercentageLabel(
      attendanceGap,
    )} behind the student just above you in the current live ranking.`;
  }

  if (confirmedOverallPercentage >= 75) {
    return `${formatPercentageLabel(
      confirmedOverallPercentage,
    )} confirmed attendance keeps you above the 75% target. Keep going while the full 100-point system rolls out.`;
  }

  return `${formatPercentageLabel(
    confirmedOverallPercentage,
  )} confirmed attendance is below the 75% target. Consistent present days will help you recover and climb in the live ranking.`;
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
      const pointsScoringMonthEndDate = getMonthEndDate(todayISO);
      const holidayCoverageEndDate =
        calendarEndDate > pointsScoringMonthEndDate
          ? calendarEndDate
          : pointsScoringMonthEndDate;

      const [
        holidayMap,
        pointsHolidayMap,
        docs,
        allStudents,
        allLeaderboardDocs,
        allLeaderboardHolidays,
        allPersonalityProfiles,
        allClassTests,
        allResultPointAssignments,
      ] =
        await Promise.all([
          getHolidayMapForContext({
            fromDate: ATTENDANCE_START_DATE,
            toDate: calendarEndDate,
            course,
            year,
            studentId: me._id,
          }),
          getHolidayMapForContext({
            fromDate: ATTENDANCE_START_DATE,
            toDate: holidayCoverageEndDate,
            course,
            year,
            studentId: me._id,
          }),
          Attendance.find({
            course,
            year,
            date: { $gte: ATTENDANCE_START_DATE, $lte: todayISO },
            $or: APPROVED_OR_LEGACY_ATTENDANCE_QUERY,
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
            $or: APPROVED_OR_LEGACY_ATTENDANCE_QUERY,
          })
            .select({ course: 1, year: 1, date: 1, records: 1 })
            .lean(),
          Holiday.find({
            date: { $gte: ATTENDANCE_START_DATE, $lte: holidayCoverageEndDate },
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
          StudentPersonalityProfile.find({})
            .select({ studentId: 1, weeklyGoals: 1, activities: 1, reflections: 1, practiceSessions: 1, voiceSessions: 1, weeklyFocus: 1, careerGoal: 1, selfIntroduction: 1, strengths: 1, growthAreas: 1 })
            .lean(),
          StudentClassTest.find({})
            .select({
              classTestName: 1,
              course: 1,
              year: 1,
              subjectCode: 1,
              subjectName: 1,
              totalMarks: 1,
              passingMarks: 1,
              extraCriteria: 1,
              testDate: 1,
              publishedAt: 1,
              createdAt: 1,
              students: 1,
            })
            .lean(),
          ResultPointAssignment.find({})
            .select("course year resultId resultName")
            .lean(),
        ]);

      const assignedResultIds = Array.from(
        new Set(
          allResultPointAssignments
            .map((assignment) => String(assignment?.resultId || ""))
            .filter(Boolean),
        ),
      );
      const assignedResults = assignedResultIds.length
        ? await StudentResult.find({
            _id: { $in: assignedResultIds },
          }).lean()
        : [];

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
      const personalityProfileMap = new Map(
        (Array.isArray(allPersonalityProfiles) ? allPersonalityProfiles : []).map(
          (profile) => [String(profile.studentId), profile],
        ),
      );
      const resultAssignmentMap = new Map(
        (Array.isArray(allResultPointAssignments) ? allResultPointAssignments : []).map(
          (assignment) => [
            getLeaderboardGroupKey(assignment.course, assignment.year),
            assignment,
          ],
        ),
      );
      const resultDocMap = new Map(
        (Array.isArray(assignedResults) ? assignedResults : []).map((result) => [
          String(result._id),
          result,
        ]),
      );
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
            monthlyStats: new Map(),
            currentMonthTimeline: [],
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

      const months = Array.from(monthsMap.values())
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
        .map((month) => {
          const confirmedMarkedDays = month.present + month.absent;
          const confirmedPercentage = calculateConfirmedPercentage(
            month.present,
            month.absent,
          );

          return {
            ...month,
            confirmedMarkedDays,
            confirmedPercentage,
            scoreBonus: getMonthlyAttendanceScoreBonus(confirmedPercentage),
          };
        });
      const pointsMonths = buildPointsMonths(months, {
        currentMonthKey,
        todayISO,
        monthEndDate: pointsScoringMonthEndDate,
        isExcluded: (date) => Boolean(pointsHolidayMap.get(date)),
      });
      const pointsTotals = summarizeMonthlyAttendance(pointsMonths);
      const pointsOverallPercentage = calculateWorkingDayPercentage(
        pointsTotals.present,
        pointsTotals.workingDays,
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
      overall.confirmedMarkedDays = overall.present + overall.absent;
      overall.confirmedPercentage = calculateConfirmedPercentage(
        overall.present,
        overall.absent,
      );
      const attendanceScore = buildPointsAttendanceScore({
        presentDays: pointsTotals.present,
        workingDays: pointsTotals.workingDays,
        monthlyBonuses: pointsMonths.map((month) => month.scoreBonus),
        bestStreak: streaks.best,
      });
      const attendanceCategory = buildAttendanceCategoryScore({
        confirmedPercentage: attendanceScore.confirmedPercentage,
        bonusMonthsCount: pointsMonths.filter(
          (month) => Number(month?.scoreBonus || 0) > 0,
        ).length,
        bestStreak: streaks.best,
      });
      const [personalityProfile, resultPointAssignment, classTests] = await Promise.all([
        StudentPersonalityProfile.findOne({
          studentId: me._id,
        }).lean(),
        ResultPointAssignment.findOne({
          course,
          year,
        })
          .select("resultId resultName")
          .lean(),
        StudentClassTest.find({
          course,
          year,
          "students.studentId": me._id,
        }).lean(),
      ]);
      const personalityDevelopment = buildPersonalitySummary(
        personalityProfile || {},
        me,
      );
      const classTestsCategory = buildClassTestsCategory(classTests, me._id);
      const selectedResult = resultPointAssignment?.resultId
        ? await StudentResult.findOne({
            _id: resultPointAssignment.resultId,
            course,
            year,
          }).lean()
        : null;
      const resultsCategory = buildResultCategory(
        selectedResult,
        me._id,
        selectedResult ? resultPointAssignment : null,
      );

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
          const applicableHoliday = getApplicableLeaderboardHoliday({
            studentId,
            course: stats.course,
            year: stats.year,
            date: leaderboardCursor,
            globalHolidayMap,
            courseHolidayMap,
            courseYearHolidayMap,
            studentHolidayMap,
          });

          if (applicableHoliday) {
            return;
          }

          stats.workingDays += 1;
          const monthKey = leaderboardCursor.slice(0, 7);
          if (!stats.monthlyStats.has(monthKey)) {
            stats.monthlyStats.set(monthKey, {
              monthKey,
              workingDays: 0,
              present: 0,
              absent: 0,
            });
          }
          const monthlyStats = stats.monthlyStats.get(monthKey);
          monthlyStats.workingDays += 1;

          const dailyRecords =
            leaderboardRecordMap.get(`${groupKey}|${leaderboardCursor}`) ||
            new Map();
          const status = dailyRecords.get(studentId) || "not_marked";
          if (status === "present") {
            stats.presentDays += 1;
            monthlyStats.present += 1;
          } else if (status === "absent") {
            stats.absentDays += 1;
            monthlyStats.absent += 1;
          }

          if (monthKey === currentMonthKey) {
            stats.currentMonthTimeline.push({
              date: leaderboardCursor,
              status,
            });
          }
        });

        leaderboardCursor = addDays(leaderboardCursor, 1);
      }

      const studentSummaries = leaderboardStudents
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
            monthlyStats: new Map(),
            currentMonthTimeline: [],
          };
          const monthlyStats = new Map(stats.monthlyStats);
          if (
            currentMonthKey >= POINTS_START_MONTH_KEY &&
            !monthlyStats.has(currentMonthKey)
          ) {
            monthlyStats.set(currentMonthKey, {
              monthKey: currentMonthKey,
              workingDays: 0,
              present: 0,
              absent: 0,
            });
          }

          const monthlyBreakdown = Array.from(monthlyStats.values())
            .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
            .map((month) => {
              const confirmedMarkedDays = month.present + month.absent;
              const confirmedPercentage = calculateConfirmedPercentage(
                month.present,
                month.absent,
              );

              return {
                ...month,
                confirmedMarkedDays,
                confirmedPercentage,
                scoreBonus: getMonthlyAttendanceScoreBonus(confirmedPercentage),
              };
            });
          const studentStreaks = calculateStreaks(stats.currentMonthTimeline);
          const studentAttendanceScore = buildAttendanceScore({
            presentDays: stats.presentDays,
            absentDays: stats.absentDays,
            monthlyBonuses: monthlyBreakdown.map((month) => month.scoreBonus),
            bestStreak: studentStreaks.best,
          });
          const studentPointsMonths = buildPointsMonths(monthlyBreakdown, {
            currentMonthKey,
            todayISO,
            monthEndDate: pointsScoringMonthEndDate,
            isExcluded: (date) =>
              Boolean(
                getApplicableLeaderboardHoliday({
                  studentId,
                  course: stats.course,
                  year: stats.year,
                  date,
                  globalHolidayMap,
                  courseHolidayMap,
                  courseYearHolidayMap,
                  studentHolidayMap,
                }),
              ),
          });
          const studentPointsTotals = summarizeMonthlyAttendance(studentPointsMonths);
          const studentPointsAttendanceScore = buildPointsAttendanceScore({
            presentDays: studentPointsTotals.present,
            workingDays: studentPointsTotals.workingDays,
            monthlyBonuses: studentPointsMonths.map((month) => month.scoreBonus),
            bestStreak: studentStreaks.best,
          });
          const studentAttendanceCategory = buildAttendanceCategoryScore({
            confirmedPercentage:
              studentPointsAttendanceScore.confirmedPercentage,
            bonusMonthsCount: studentPointsMonths.filter(
              (month) => Number(month?.scoreBonus || 0) > 0,
            ).length,
            bestStreak: studentStreaks.best,
          });
          const studentPersonalityDevelopment = buildPersonalitySummary(
            personalityProfileMap.get(studentId) || {},
            student,
          );
          const studentClassTestsCategory = buildClassTestsCategory(
            (Array.isArray(allClassTests) ? allClassTests : []).filter(
              (test) =>
                String(test?.course || "").toUpperCase() === stats.course &&
                Number(test?.year || 0) === stats.year,
            ),
            studentId,
          );
          const batchAssignment =
            resultAssignmentMap.get(getLeaderboardGroupKey(stats.course, stats.year)) ||
            null;
          const batchResult =
            batchAssignment?.resultId
              ? resultDocMap.get(String(batchAssignment.resultId)) || null
              : null;
          const studentResultsCategory = buildResultCategory(
            batchResult,
            studentId,
            batchResult ? batchAssignment : null,
          );
          const studentPersonalityFrameworkPoints =
            getFrameworkPersonalityPoints(studentPersonalityDevelopment);
          const studentOverallFrameworkPoints =
            studentAttendanceCategory.totalPoints +
            Number(studentClassTestsCategory?.totalPoints || 0) +
            studentPersonalityFrameworkPoints +
            Number(studentResultsCategory?.totalPoints || 0);
          const studentLiveCategoryCount = [
            true,
            Boolean(studentClassTestsCategory?.hasPublishedTests),
            studentPersonalityFrameworkPoints > 0,
            Boolean(studentResultsCategory?.hasPublishedResult),
          ].filter(Boolean).length;
          const overallPercentage =
            stats.workingDays === 0
              ? 0
              : Number(((stats.presentDays / stats.workingDays) * 100).toFixed(1));
          const pointsOverallPercentage = calculateWorkingDayPercentage(
            studentPointsTotals.present,
            studentPointsTotals.workingDays,
          );

          return {
            studentId,
            name: stats.name,
            profileImage: stats.profileImage,
            course: stats.course,
            year: stats.year,
            overallPercentage,
            confirmedOverallPercentage: studentAttendanceScore.confirmedPercentage,
            confirmedMarkedDays: studentAttendanceScore.confirmedMarkedDays,
            attendanceScore: studentAttendanceScore.totalScore,
            attendanceScoreBreakdown: {
              baseScore: studentAttendanceScore.baseScore,
              monthlyBonusTotal: studentAttendanceScore.monthlyBonusTotal,
              streakBonus: studentAttendanceScore.streakBonus,
            },
            presentDays: stats.presentDays,
            absentDays: stats.absentDays,
            workingDays: stats.workingDays,
            pointsOverallPercentage,
            pointsConfirmedOverallPercentage:
              studentPointsAttendanceScore.confirmedPercentage,
            pointsConfirmedMarkedDays: studentPointsAttendanceScore.confirmedMarkedDays,
            pointsAttendanceScore: studentPointsAttendanceScore.totalScore,
            pointsAttendanceScoreBreakdown: {
              baseScore: studentPointsAttendanceScore.baseScore,
              monthlyBonusTotal: studentPointsAttendanceScore.monthlyBonusTotal,
              streakBonus: studentPointsAttendanceScore.streakBonus,
            },
            attendanceCategoryPoints: studentAttendanceCategory.totalPoints,
            attendanceCategoryBreakdown: studentAttendanceCategory,
            classTestsCategoryPoints: Number(
              studentClassTestsCategory?.totalPoints || 0,
            ),
            classTestsCategoryBreakdown: studentClassTestsCategory,
            personalityCategoryPoints: studentPersonalityFrameworkPoints,
            personalityCategoryBreakdown: {
              totalPoints: studentPersonalityFrameworkPoints,
              maxPoints: Number(
                studentPersonalityDevelopment?.score?.maxPoints || 10,
              ),
            },
            resultsCategoryPoints: Number(studentResultsCategory?.totalPoints || 0),
            resultsCategoryBreakdown: studentResultsCategory,
            overallFrameworkPoints: studentOverallFrameworkPoints,
            overallFrameworkMaxPoints: TOTAL_STUDENT_POINTS,
            liveCategoryCount: studentLiveCategoryCount,
            pointsPresentDays: studentPointsTotals.present,
            pointsAbsentDays: studentPointsTotals.absent,
            pointsWorkingDays: studentPointsTotals.workingDays,
            isCurrentUser: studentId === String(me._id),
          };
        });

      const leaderboardEntries = studentSummaries
        .map((entry) => ({
          ...entry,
          overallPercentage: entry.pointsOverallPercentage,
          confirmedOverallPercentage: entry.pointsConfirmedOverallPercentage,
          confirmedMarkedDays: entry.pointsConfirmedMarkedDays,
          attendanceScore: entry.attendanceCategoryPoints,
          attendanceScoreBreakdown: entry.attendanceCategoryBreakdown,
          attendanceCategoryPoints: entry.attendanceCategoryPoints,
          attendanceCategoryBreakdown: entry.attendanceCategoryBreakdown,
          classTestsCategoryPoints: entry.classTestsCategoryPoints,
          classTestsCategoryBreakdown: entry.classTestsCategoryBreakdown,
          personalityCategoryPoints: entry.personalityCategoryPoints,
          personalityCategoryBreakdown: entry.personalityCategoryBreakdown,
          resultsCategoryPoints: entry.resultsCategoryPoints,
          resultsCategoryBreakdown: entry.resultsCategoryBreakdown,
          overallFrameworkPoints: entry.overallFrameworkPoints,
          overallFrameworkMaxPoints: entry.overallFrameworkMaxPoints,
          liveCategoryCount: entry.liveCategoryCount,
          presentDays: entry.pointsPresentDays,
          absentDays: entry.pointsAbsentDays,
          workingDays: entry.pointsWorkingDays,
        }))
        .sort(
          (a, b) =>
            b.overallFrameworkPoints - a.overallFrameworkPoints ||
            b.liveCategoryCount - a.liveCategoryCount ||
            b.resultsCategoryPoints - a.resultsCategoryPoints ||
            b.classTestsCategoryPoints - a.classTestsCategoryPoints ||
            b.attendanceCategoryPoints - a.attendanceCategoryPoints ||
            b.confirmedOverallPercentage - a.confirmedOverallPercentage ||
            b.overallPercentage - a.overallPercentage ||
            b.presentDays - a.presentDays ||
            a.name.localeCompare(b.name),
        )
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
          title: getLeaderboardTitle(index + 1),
        }));

      const attendanceLeaderboardEntries = [...studentSummaries]
        .sort(
          (a, b) =>
            b.confirmedOverallPercentage - a.confirmedOverallPercentage ||
            b.presentDays - a.presentDays ||
            a.name.localeCompare(b.name),
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
        overallFrameworkPoints: entry.overallFrameworkPoints,
        overallFrameworkMaxPoints: entry.overallFrameworkMaxPoints,
        liveCategoryCount: entry.liveCategoryCount,
        attendanceScore: entry.attendanceScore,
        attendanceCategoryPoints: entry.attendanceCategoryPoints,
        attendanceCategoryBreakdown: entry.attendanceCategoryBreakdown,
        classTestsCategoryPoints: entry.classTestsCategoryPoints,
        classTestsCategoryBreakdown: entry.classTestsCategoryBreakdown,
        personalityCategoryPoints: entry.personalityCategoryPoints,
        personalityCategoryBreakdown: entry.personalityCategoryBreakdown,
        resultsCategoryPoints: entry.resultsCategoryPoints,
        resultsCategoryBreakdown: entry.resultsCategoryBreakdown,
        confirmedOverallPercentage: entry.confirmedOverallPercentage,
        confirmedMarkedDays: entry.confirmedMarkedDays,
        overallPercentage: entry.overallPercentage,
        presentDays: entry.presentDays,
        absentDays: entry.absentDays,
        workingDays: entry.workingDays,
        ...getAttendanceTierDetails(entry.confirmedOverallPercentage),
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
        scope: "overallFrameworkPoints",
        totalStudents: leaderboardEntries.length,
        yourRank: currentUserRanking?.rank ?? null,
        yourTitle: currentUserRanking?.title || getLeaderboardTitle(1),
        yourOverallFrameworkPoints:
          currentUserRanking?.overallFrameworkPoints ??
          (attendanceCategory.totalPoints +
            Number(classTestsCategory?.totalPoints || 0) +
            getFrameworkPersonalityPoints(personalityDevelopment) +
            Number(resultsCategory?.totalPoints || 0)),
        yourOverallFrameworkMaxPoints: TOTAL_STUDENT_POINTS,
        yourLiveCategoryCount:
          currentUserRanking?.liveCategoryCount ??
          [
            true,
            Boolean(classTestsCategory?.hasPublishedTests),
            getFrameworkPersonalityPoints(personalityDevelopment) > 0,
            Boolean(resultsCategory?.hasPublishedResult),
          ].filter(Boolean).length,
        yourAttendanceScore:
          currentUserRanking?.attendanceScore ?? attendanceCategory.totalPoints,
        yourAttendanceCategoryPoints:
          currentUserRanking?.attendanceCategoryPoints ??
          attendanceCategory.totalPoints,
        yourClassTestsCategoryPoints:
          currentUserRanking?.classTestsCategoryPoints ??
          Number(classTestsCategory?.totalPoints || 0),
        yourPersonalityCategoryPoints:
          currentUserRanking?.personalityCategoryPoints ??
          getFrameworkPersonalityPoints(personalityDevelopment),
        yourResultsCategoryPoints:
          currentUserRanking?.resultsCategoryPoints ??
          Number(resultsCategory?.totalPoints || 0),
        yourConfirmedOverallPercentage:
          currentUserRanking?.confirmedOverallPercentage ??
          attendanceScore.confirmedPercentage,
        yourConfirmedMarkedDays:
          currentUserRanking?.confirmedMarkedDays ??
          attendanceScore.confirmedMarkedDays,
        yourScoreBase:
          currentUserRanking?.attendanceScoreBreakdown?.baseScore ??
          attendanceCategory.coveragePoints,
        yourMonthlyBonusTotal:
          currentUserRanking?.attendanceScoreBreakdown?.monthlyBonusTotal ??
          attendanceCategory.monthlyConsistencyPoints,
        yourStreakBonus:
          currentUserRanking?.attendanceScoreBreakdown?.streakBonus ??
          attendanceCategory.streakPoints,
        yourAttendanceCategoryBreakdown:
          currentUserRanking?.attendanceCategoryBreakdown || attendanceCategory,
        yourOverallPercentage:
          currentUserRanking?.overallPercentage ?? pointsOverallPercentage,
        yourPresentDays: currentUserRanking?.presentDays ?? pointsTotals.present,
        yourAbsentDays: currentUserRanking?.absentDays ?? pointsTotals.absent,
        yourWorkingDays: currentUserRanking?.workingDays ?? pointsTotals.workingDays,
        scoreGapToNextRank:
          currentUserRanking && higherRankEntry
            ? Math.max(
                0,
                higherRankEntry.overallFrameworkPoints -
                  currentUserRanking.overallFrameworkPoints,
              )
            : 0,
        motivation: buildOverallPointsLeaderboardMessage({
          rank: currentUserRanking?.rank ?? 1,
          overallFrameworkPoints:
            currentUserRanking?.overallFrameworkPoints ??
            (attendanceCategory.totalPoints +
              Number(classTestsCategory?.totalPoints || 0) +
              getFrameworkPersonalityPoints(personalityDevelopment) +
              Number(resultsCategory?.totalPoints || 0)),
          overallFrameworkMaxPoints: TOTAL_STUDENT_POINTS,
          liveCategoryCount:
            currentUserRanking?.liveCategoryCount ??
            [
              true,
              Boolean(classTestsCategory?.hasPublishedTests),
              getFrameworkPersonalityPoints(personalityDevelopment) > 0,
              Boolean(resultsCategory?.hasPublishedResult),
            ].filter(Boolean).length,
          standings: leaderboardEntries,
        }),
        topStudents: leaderboardEntries.slice(0, 5).map(toPublicLeaderboardEntry),
        nearbyStudents: leaderboardEntries
          .slice(normalizedNearbyStart, nearbyEnd)
          .map(toPublicLeaderboardEntry),
      };

      const currentAttendanceRanking =
        attendanceLeaderboardEntries.find((entry) => entry.isCurrentUser) || null;
      const currentAttendanceIndex = attendanceLeaderboardEntries.findIndex(
        (entry) => entry.isCurrentUser,
      );
      const attendanceNearbyStart =
        currentAttendanceIndex < 0 ? 0 : Math.max(0, currentAttendanceIndex - 2);
      const attendanceNearbyEnd =
        currentAttendanceIndex < 0
          ? Math.min(5, attendanceLeaderboardEntries.length)
          : Math.min(
              attendanceLeaderboardEntries.length,
              attendanceNearbyStart + 5,
            );
      const normalizedAttendanceNearbyStart = Math.max(
        0,
        attendanceNearbyEnd - 5,
      );
      const higherAttendanceEntry =
        currentAttendanceIndex > 0
          ? attendanceLeaderboardEntries[currentAttendanceIndex - 1]
          : null;

      const attendanceLeaderboard = {
        scope: "confirmedAttendance",
        totalStudents: attendanceLeaderboardEntries.length,
        yourRank: currentAttendanceRanking?.rank ?? null,
        yourTitle: currentAttendanceRanking?.title || getLeaderboardTitle(1),
        yourConfirmedOverallPercentage:
          currentAttendanceRanking?.confirmedOverallPercentage ??
          overall.confirmedPercentage,
        yourConfirmedMarkedDays:
          currentAttendanceRanking?.confirmedMarkedDays ??
          overall.confirmedMarkedDays,
        yourPresentDays: currentAttendanceRanking?.presentDays ?? overall.present,
        yourAbsentDays: currentAttendanceRanking?.absentDays ?? overall.absent,
        yourWorkingDays:
          currentAttendanceRanking?.workingDays ?? overall.workingDays,
        gapToNextRank:
          currentAttendanceRanking && higherAttendanceEntry
            ? Number(
                Math.max(
                  0,
                  higherAttendanceEntry.confirmedOverallPercentage -
                    currentAttendanceRanking.confirmedOverallPercentage,
                ).toFixed(1),
              )
            : 0,
        motivation: buildAttendanceLeaderboardMessage({
          rank: currentAttendanceRanking?.rank ?? 1,
          confirmedOverallPercentage:
            currentAttendanceRanking?.confirmedOverallPercentage ??
            overall.confirmedPercentage,
          standings: attendanceLeaderboardEntries,
        }),
        topStudents: attendanceLeaderboardEntries
          .slice(0, 5)
          .map(toPublicLeaderboardEntry),
        nearbyStudents: attendanceLeaderboardEntries
          .slice(normalizedAttendanceNearbyStart, attendanceNearbyEnd)
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
        pointsStartDate: POINTS_START_DATE,
        overallFrameworkPoints:
          attendanceCategory.totalPoints +
          Number(classTestsCategory?.totalPoints || 0) +
          getFrameworkPersonalityPoints(personalityDevelopment) +
          Number(resultsCategory?.totalPoints || 0),
        overallFrameworkMaxPoints: TOTAL_STUDENT_POINTS,
        rules: {
          sundaysAreHolidays: true,
          winterVacationExcluded: true,
          customHolidaysExcluded: true,
        },
        overall,
        attendanceScore,
        attendanceCategory,
        classTestsCategory,
        personalityDevelopment: {
          ...personalityDevelopment,
          categoryPoints: Number(personalityDevelopment?.score?.totalPoints || 0),
          categoryMaxPoints: Number(personalityDevelopment?.score?.maxPoints || 10),
        },
        resultsCategory,
        streaks,
        streakProgress,
        badges,
        leaderboard,
        attendanceLeaderboard,
        pointsMonths,
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
        $or: APPROVED_OR_LEGACY_ATTENDANCE_QUERY,
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
        $or: APPROVED_OR_LEGACY_ATTENDANCE_QUERY,
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
