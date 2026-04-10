"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProfileAvatar from "../../../components/ProfileAvatar";
import {
  ArrowRight,
  Award,
  BookOpen,
  ClipboardList,
  FileText,
  Flame,
  GraduationCap,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";
import {
  RESUME_BUILDER_UNLOCK_POINTS,
  RESUME_POINTS_RULES,
  RESUME_POINTS_UNLOCK_NOTE,
  TOTAL_STUDENT_POINTS,
} from "../../../lib/studentResume";

function formatLeaderboardPercentage(value) {
  const numericValue = Number(value);
  return `${(Number.isFinite(numericValue) ? numericValue : 0).toFixed(1)}%`;
}

function formatLeaderboardScore(value) {
  const numericValue = Number(value);
  return `${Math.max(
    0,
    Math.round(Number.isFinite(numericValue) ? numericValue : 0),
  )}`;
}

function formatScopeDate(value) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getLeaderboardTitleShell(title) {
  if (title === "Legend") {
    return "bg-amber-100 text-amber-800";
  }

  if (title === "Elite") {
    return "bg-indigo-100 text-indigo-700";
  }

  if (title === "Active") {
    return "bg-sky-100 text-sky-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getLeaderboardRankShell(rank, isCurrentUser) {
  if (rank === 1) {
    return isCurrentUser
      ? "border border-amber-300 bg-[linear-gradient(135deg,rgba(251,191,36,0.24),rgba(255,255,255,0.96),rgba(253,230,138,0.38))] text-amber-900 shadow-sm"
      : "border border-amber-200 bg-[linear-gradient(135deg,rgba(254,243,199,0.98),rgba(255,255,255,0.96),rgba(251,191,36,0.26))] text-amber-900 shadow-sm";
  }

  if (rank === 2) {
    return isCurrentUser
      ? "border border-slate-300 bg-[linear-gradient(135deg,rgba(226,232,240,0.95),rgba(255,255,255,0.96),rgba(203,213,225,0.72))] text-slate-800 shadow-sm"
      : "border border-slate-200 bg-[linear-gradient(135deg,rgba(241,245,249,0.98),rgba(255,255,255,0.96),rgba(226,232,240,0.86))] text-slate-800 shadow-sm";
  }

  if (rank === 3) {
    return isCurrentUser
      ? "border border-[#c08457] bg-[linear-gradient(135deg,rgba(194,120,58,0.24),rgba(255,255,255,0.96),rgba(251,191,116,0.36))] text-[#7c2d12] shadow-sm"
      : "border border-[#d6a272] bg-[linear-gradient(135deg,rgba(250,240,230,0.98),rgba(255,255,255,0.96),rgba(194,120,58,0.2))] text-[#7c2d12] shadow-sm";
  }

  if (isCurrentUser) {
    return "border border-blue-200 bg-blue-50/90 text-blue-800 shadow-sm";
  }

  return "border border-slate-200 bg-slate-50/90 text-slate-700";
}

function getLeaderboardRankLabel(rank) {
  if (rank === 1) return "1st Place";
  if (rank === 2) return "2nd Place";
  if (rank === 3) return "3rd Place";
  return `#${rank}`;
}

function getLeaderboardTierShell(tierTone, tierIsLive) {
  if (tierTone === "rose") {
    return tierIsLive
      ? "border border-rose-200 bg-gradient-to-r from-rose-100 to-amber-100 text-rose-700 shadow-sm"
      : "border border-rose-100 bg-rose-50/90 text-rose-700";
  }

  if (tierTone === "indigo") {
    return tierIsLive
      ? "border border-indigo-200 bg-indigo-100 text-indigo-700 shadow-sm"
      : "border border-indigo-100 bg-indigo-50/90 text-indigo-700";
  }

  if (tierTone === "emerald") {
    return tierIsLive
      ? "border border-emerald-200 bg-emerald-100 text-emerald-700 shadow-sm"
      : "border border-emerald-100 bg-emerald-50/90 text-emerald-700";
  }

  if (tierTone === "sky") {
    return tierIsLive
      ? "border border-sky-200 bg-sky-100 text-sky-700 shadow-sm"
      : "border border-sky-100 bg-sky-50/90 text-sky-700";
  }

  if (tierTone === "amber") {
    return tierIsLive
      ? "border border-amber-200 bg-amber-100 text-amber-700 shadow-sm"
      : "border border-amber-100 bg-amber-50/90 text-amber-700";
  }

  return "border border-slate-200 bg-slate-100 text-slate-600";
}

function getLeaderboardTierNote(student) {
  const presentDays = Number(student?.presentDays || 0);
  const workingDays = Number(
    student?.workingDays ||
      student?.confirmedMarkedDays ||
      presentDays + Number(student?.absentDays || 0),
  );
  const confirmedOverallPercentage = Number(
    student?.confirmedOverallPercentage || 0,
  );
  const attendanceCategoryPoints = Number(
    student?.attendanceCategoryPoints ?? student?.attendanceScore ?? 0,
  );
  const attendanceCategoryMaxPoints = Number(
    student?.attendanceCategoryBreakdown?.maxPoints || 25,
  );

  if (workingDays > 0) {
    return `Category ${formatLeaderboardScore(
      attendanceCategoryPoints,
    )}/${formatLeaderboardScore(attendanceCategoryMaxPoints)} • ${formatLeaderboardPercentage(
      confirmedOverallPercentage,
    )} coverage • ${presentDays}/${workingDays} working days present`;
  }

  return `Category ${formatLeaderboardScore(
    attendanceCategoryPoints,
  )}/${formatLeaderboardScore(attendanceCategoryMaxPoints)} • ${formatLeaderboardPercentage(
    confirmedOverallPercentage,
  )} coverage`;
}

function getLeaderboardRowShell(rank, isCurrentUser) {
  if (rank === 1) {
    return isCurrentUser
      ? "border-amber-300 bg-[linear-gradient(135deg,rgba(255,251,235,0.99),rgba(239,246,255,0.94),rgba(253,230,138,0.88))] shadow-[0_24px_52px_-34px_rgba(217,119,6,0.45)]"
      : "border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.99),rgba(255,255,255,0.96),rgba(255,237,213,0.9))] shadow-[0_24px_52px_-38px_rgba(217,119,6,0.35)]";
  }

  if (rank === 2) {
    return isCurrentUser
      ? "border-slate-300 bg-[linear-gradient(135deg,rgba(248,250,252,0.99),rgba(239,246,255,0.94),rgba(226,232,240,0.9))] shadow-[0_24px_52px_-38px_rgba(71,85,105,0.35)]"
      : "border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.99),rgba(255,255,255,0.96),rgba(226,232,240,0.9))] shadow-[0_24px_52px_-40px_rgba(100,116,139,0.28)]";
  }

  if (rank === 3) {
    return isCurrentUser
      ? "border-[#c08457] bg-[linear-gradient(135deg,rgba(255,243,230,0.99),rgba(239,246,255,0.94),rgba(214,162,114,0.92))] shadow-[0_24px_52px_-38px_rgba(146,64,14,0.32)]"
      : "border-[#d6a272] bg-[linear-gradient(135deg,rgba(255,245,235,0.99),rgba(255,255,255,0.96),rgba(214,162,114,0.86))] shadow-[0_24px_52px_-40px_rgba(146,64,14,0.22)]";
  }

  if (isCurrentUser) {
    return "border-blue-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(255,255,255,0.96),rgba(224,231,255,0.92))] shadow-[0_18px_38px_-30px_rgba(37,99,235,0.45)]";
  }

  if (rank <= 5) {
    return "border-indigo-100 bg-[linear-gradient(135deg,rgba(238,242,255,0.98),rgba(255,255,255,0.96),rgba(224,231,255,0.88))]";
  }

  return "border-white/80 bg-white/82";
}

function formatPointsPair(current, total) {
  return `${formatLeaderboardScore(current)}/${formatLeaderboardScore(total)}`;
}

function getFrameworkStatusShell(status) {
  if (status === "live") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border border-amber-200 bg-amber-50 text-amber-700";
}

function getAttendanceCategoryStreakPoints(bestStreak) {
  const streak = Number(bestStreak || 0);

  if (streak >= 25) return 5;
  if (streak >= 15) return 4;
  if (streak >= 10) return 3;
  if (streak >= 6) return 2;
  if (streak >= 3) return 1;
  return 0;
}

const ATTENDANCE_COVERAGE_EXAMPLES = [
  { threshold: "100% coverage", points: "15/15 pts" },
  { threshold: "90% coverage", points: "14/15 pts" },
  { threshold: "80% coverage", points: "12/15 pts" },
  { threshold: "75% coverage", points: "11/15 pts" },
  { threshold: "60% coverage", points: "9/15 pts" },
];

const MONTHLY_CONSISTENCY_TIERS = [
  { threshold: "1 qualified month", points: "1/5 pts" },
  { threshold: "2 qualified months", points: "2/5 pts" },
  { threshold: "3 qualified months", points: "3/5 pts" },
  { threshold: "4 qualified months", points: "4/5 pts" },
  { threshold: "5+ qualified months", points: "5/5 pts" },
];

const ATTENDANCE_STREAK_TIERS = [
  { threshold: "3+ days", points: "1/5 pts" },
  { threshold: "6+ days", points: "2/5 pts" },
  { threshold: "10+ days", points: "3/5 pts" },
  { threshold: "15+ days", points: "4/5 pts" },
  { threshold: "25+ days", points: "5/5 pts" },
];

export default function StudentPointsPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch("/api/student/attendance?view=summary", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load points");
        }

        setSummary(data);
      } catch (error) {
        setErr(error.message || "Error");
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, []);

  const attendanceScore = summary?.attendanceScore || {
    totalScore: 0,
    baseScore: 0,
    monthlyBonusTotal: 0,
    streakBonus: 0,
    confirmedPercentage: 0,
    confirmedMarkedDays: 0,
    workingDays: 0,
  };

  const leaderboard = summary?.leaderboard || {
    totalStudents: 0,
    yourRank: null,
    yourTitle: "Rising",
    yourAttendanceScore: 0,
    yourConfirmedOverallPercentage: 0,
    yourConfirmedMarkedDays: 0,
    yourScoreBase: 0,
    yourMonthlyBonusTotal: 0,
    yourStreakBonus: 0,
    scoreGapToNextRank: 0,
    motivation: "",
    topStudents: [],
    nearbyStudents: [],
  };
  const pointsStartDate = summary?.pointsStartDate || "2026-04-01";
  const pointsStartMonthKey = String(pointsStartDate).slice(0, 7);
  const pointsStartLabel = useMemo(
    () => formatScopeDate(pointsStartDate),
    [pointsStartDate],
  );

  const topStudents = Array.isArray(leaderboard.topStudents)
    ? leaderboard.topStudents
    : [];
  const nearbyStudents = Array.isArray(leaderboard.nearbyStudents)
    ? leaderboard.nearbyStudents
    : [];
  const hasLeaderboardData = topStudents.length > 0 || nearbyStudents.length > 0;
  const monthlyBonuses = useMemo(
    () =>
      Array.isArray(summary?.pointsMonths)
        ? summary.pointsMonths.filter(
            (month) =>
              Number(month?.scoreBonus || 0) > 0 ||
              Number(month?.present || 0) + Number(month?.absent || 0) > 0,
          )
        : Array.isArray(summary?.months)
          ? summary.months.filter(
              (month) =>
                String(month?.monthKey || "") >= pointsStartMonthKey &&
                (Number(month?.scoreBonus || 0) > 0 ||
                  Number(month?.present || 0) + Number(month?.absent || 0) > 0),
            )
        : [],
    [summary, pointsStartMonthKey],
  );
  const attendanceCategory = useMemo(() => {
    if (summary?.attendanceCategory) {
      return {
        ...summary.attendanceCategory,
        earnedPoints: Number(summary.attendanceCategory.totalPoints || 0),
      };
    }

    const coveragePoints = Math.min(
      15,
      Math.max(
        0,
        Math.round((Number(attendanceScore.confirmedPercentage || 0) / 100) * 15),
      ),
    );
    const bonusMonthsCount = monthlyBonuses.filter(
      (month) => Number(month?.scoreBonus || 0) > 0,
    ).length;
    const monthlyConsistencyPoints = Math.min(5, bonusMonthsCount);
    const bestStreak = Number(summary?.streaks?.best || 0);
    const streakPoints = getAttendanceCategoryStreakPoints(bestStreak);

    return {
      earnedPoints: coveragePoints + monthlyConsistencyPoints + streakPoints,
      totalPoints: coveragePoints + monthlyConsistencyPoints + streakPoints,
      maxPoints: 25,
      coveragePoints,
      coverageMax: 15,
      monthlyConsistencyPoints,
      monthlyConsistencyMax: 5,
      streakPoints,
      streakMax: 5,
      bonusMonthsCount,
      bestStreak,
    };
  }, [
    attendanceScore.confirmedPercentage,
    monthlyBonuses,
    summary?.attendanceCategory,
    summary?.streaks?.best,
  ]);
  const pointsCategories = useMemo(
    () => [
      {
        key: "attendance",
        label: "Attendance and consistency",
        shortLabel: "Attendance",
        description:
          "This is the only live category right now. It rewards attendance coverage, monthly consistency, and your current-month streak tier.",
        earnedPoints: attendanceCategory.earnedPoints,
        maxPoints: 25,
        status: "live",
        icon: TrendingUp,
        toneShell:
          "border-blue-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(255,255,255,0.96),rgba(224,231,255,0.9))]",
        rows: [
          {
            label: "Coverage score",
            value: `${formatPointsPair(
              attendanceCategory.coveragePoints,
              attendanceCategory.coverageMax,
            )} from ${attendanceScore.confirmedPercentage}% attendance coverage`,
          },
          {
            label: "Monthly consistency score",
            value: `${formatPointsPair(
              attendanceCategory.monthlyConsistencyPoints,
              attendanceCategory.monthlyConsistencyMax,
            )} from ${attendanceCategory.bonusMonthsCount} qualified month${
              attendanceCategory.bonusMonthsCount === 1 ? "" : "s"
            }`,
          },
          {
            label: "Streak-tier score",
            value: `${formatPointsPair(
              attendanceCategory.streakPoints,
              attendanceCategory.streakMax,
            )} from best streak of ${attendanceCategory.bestStreak} day${
              attendanceCategory.bestStreak === 1 ? "" : "s"
            }`,
          },
        ],
      },
      {
        key: "assignments",
        label: "Assignments",
        shortLabel: "Assignments",
        description:
          "This category is now reserved in the system so regular submission discipline can affect the final score once assignment records are available.",
        earnedPoints: 0,
        maxPoints: 20,
        status: "planned",
        icon: ClipboardList,
        toneShell:
          "border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(255,255,255,0.96),rgba(220,252,231,0.9))]",
        rows: [
          { label: "On-time submission", value: "Up to 10 points" },
          { label: "Completion rate", value: "Up to 5 points" },
          { label: "Marks or quality", value: "Up to 5 points" },
        ],
      },
      {
        key: "class-tests",
        label: "Class tests",
        shortLabel: "Class Tests",
        description:
          "This category is reserved for regular academic checks so class test performance can contribute to the total score.",
        earnedPoints: 0,
        maxPoints: 25,
        status: "planned",
        icon: BookOpen,
        toneShell:
          "border-violet-100 bg-[linear-gradient(135deg,rgba(245,243,255,0.98),rgba(255,255,255,0.96),rgba(233,213,255,0.88))]",
        rows: [
          { label: "Average test marks", value: "Up to 15 points" },
          { label: "Consistency", value: "Up to 5 points" },
          { label: "Improvement trend", value: "Up to 5 points" },
        ],
      },
      {
        key: "results",
        label: "Results",
        shortLabel: "Results",
        description:
          "This is the highest-weight academic category and will activate when result records are published inside the portal.",
        earnedPoints: 0,
        maxPoints: 30,
        status: "planned",
        icon: GraduationCap,
        toneShell:
          "border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,255,255,0.96),rgba(254,240,138,0.84))]",
        rows: [
          { label: "Result percentage", value: "Up to 20 points" },
          { label: "Pass all subjects", value: "Up to 5 points" },
          { label: "High-performance bonus", value: "Up to 5 points" },
        ],
      },
    ],
    [attendanceCategory, attendanceScore.confirmedPercentage],
  );
  const overallFrameworkPoints = useMemo(
    () =>
      pointsCategories.reduce(
        (sum, category) => sum + Number(category?.earnedPoints || 0),
        0,
      ),
    [pointsCategories],
  );
  const visibleOverallFrameworkPoints = Number(
    summary?.overallFrameworkPoints ?? overallFrameworkPoints,
  );
  const resumeBuilderUnlocked =
    visibleOverallFrameworkPoints >= RESUME_BUILDER_UNLOCK_POINTS;
  const liveCategories = useMemo(
    () => pointsCategories.filter((category) => category.status === "live").length,
    [pointsCategories],
  );
  const resumePointUses = useMemo(() => {
    const coverageUnlocked =
      attendanceCategory.coveragePoints >=
      RESUME_POINTS_RULES.coverageAchievement.minCoveragePoints;
    const streakUnlocked =
      attendanceCategory.streakPoints >=
      RESUME_POINTS_RULES.streakAchievement.minStreakPoints;
    const monthlyUnlocked =
      attendanceCategory.monthlyConsistencyPoints >=
      RESUME_POINTS_RULES.monthlyConsistencyAchievement
        .minMonthlyConsistencyPoints;
    const strongProfileUnlocked =
      attendanceCategory.earnedPoints >=
      RESUME_POINTS_RULES.strongProfileAchievement
        .minAttendanceCategoryPoints;

    return [
      {
        feature: RESUME_POINTS_RULES.previewAccess.feature,
        rule: RESUME_POINTS_RULES.previewAccess.requirement,
        yourStatus: resumeBuilderUnlocked
          ? "Available now • builder unlocked"
          : "Available now • preview mode",
        benefit: RESUME_POINTS_RULES.previewAccess.benefit,
        actionLabel: resumeBuilderUnlocked
          ? "Open resume builder"
          : "Open resume preview",
        actionHref: "/dashboard/student/points/resume",
        statusTone: "live",
      },
      {
        feature: RESUME_POINTS_RULES.builderUnlock.feature,
        rule: RESUME_POINTS_RULES.builderUnlock.requirement,
        yourStatus: resumeBuilderUnlocked
          ? `Unlocked now • ${formatPointsPair(
              visibleOverallFrameworkPoints,
              TOTAL_STUDENT_POINTS,
            )}`
          : `Locked • ${formatLeaderboardScore(
              RESUME_BUILDER_UNLOCK_POINTS - visibleOverallFrameworkPoints,
            )} more points needed`,
        benefit: RESUME_POINTS_RULES.builderUnlock.benefit,
        actionLabel: resumeBuilderUnlocked
          ? "Builder active"
          : "Track total points",
        actionHref: resumeBuilderUnlocked
          ? "/dashboard/student/points/resume"
          : "/dashboard/student/points#points-guidelines",
        statusTone: resumeBuilderUnlocked ? "live" : "locked",
      },
      {
        feature: RESUME_POINTS_RULES.coverageAchievement.feature,
        rule: RESUME_POINTS_RULES.coverageAchievement.requirement,
        yourStatus: coverageUnlocked
          ? `Unlocked now • ${attendanceScore.confirmedPercentage}% coverage`
          : `Locked • ${attendanceCategory.coveragePoints}/15 coverage points`,
        benefit: RESUME_POINTS_RULES.coverageAchievement.benefit,
        actionLabel: coverageUnlocked
          ? "Import in resume builder"
          : "Build attendance coverage",
        actionHref: coverageUnlocked
          ? "/dashboard/student/points/resume"
          : "/dashboard/student/attendance",
        statusTone: coverageUnlocked ? "live" : "locked",
      },
      {
        feature: RESUME_POINTS_RULES.streakAchievement.feature,
        rule: RESUME_POINTS_RULES.streakAchievement.requirement,
        yourStatus: streakUnlocked
          ? `Unlocked now • ${attendanceCategory.bestStreak}-day best streak`
          : `Locked • ${attendanceCategory.bestStreak}-day best streak`,
        benefit: RESUME_POINTS_RULES.streakAchievement.benefit,
        actionLabel: streakUnlocked
          ? "Import in resume builder"
          : "Build streak points",
        actionHref: streakUnlocked
          ? "/dashboard/student/points/resume"
          : "/dashboard/student/attendance",
        statusTone: streakUnlocked ? "live" : "locked",
      },
      {
        feature: RESUME_POINTS_RULES.monthlyConsistencyAchievement.feature,
        rule: RESUME_POINTS_RULES.monthlyConsistencyAchievement.requirement,
        yourStatus: monthlyUnlocked
          ? `Unlocked now • ${attendanceCategory.bonusMonthsCount} qualified month${
              attendanceCategory.bonusMonthsCount === 1 ? "" : "s"
            }`
          : `Locked • ${attendanceCategory.monthlyConsistencyPoints}/5 monthly consistency points`,
        benefit: RESUME_POINTS_RULES.monthlyConsistencyAchievement.benefit,
        actionLabel: monthlyUnlocked
          ? "Import in resume builder"
          : "Build month consistency",
        actionHref: monthlyUnlocked
          ? "/dashboard/student/points/resume"
          : "/dashboard/student/attendance",
        statusTone: monthlyUnlocked ? "live" : "locked",
      },
      {
        feature: RESUME_POINTS_RULES.strongProfileAchievement.feature,
        rule: RESUME_POINTS_RULES.strongProfileAchievement.requirement,
        yourStatus: strongProfileUnlocked
          ? `Unlocked now • ${attendanceCategory.earnedPoints}/25 attendance-category points`
          : `Locked • ${attendanceCategory.earnedPoints}/25 attendance-category points`,
        benefit: RESUME_POINTS_RULES.strongProfileAchievement.benefit,
        actionLabel: strongProfileUnlocked
          ? "Import in resume builder"
          : "Grow total points",
        actionHref: strongProfileUnlocked
          ? "/dashboard/student/points/resume"
          : "/dashboard/student/attendance",
        statusTone: strongProfileUnlocked ? "live" : "locked",
      },
    ];
  }, [
    attendanceCategory.bestStreak,
    attendanceCategory.bonusMonthsCount,
    attendanceCategory.coveragePoints,
    attendanceCategory.earnedPoints,
    attendanceCategory.monthlyConsistencyPoints,
    attendanceCategory.streakPoints,
    attendanceScore.confirmedPercentage,
    resumeBuilderUnlocked,
    visibleOverallFrameworkPoints,
  ]);
  const unlockedResumeUseCount = useMemo(
    () =>
      resumePointUses.filter((item) => item.statusTone === "live").length,
    [resumePointUses],
  );
  const plannedPointUses = useMemo(
    () => [
      {
        feature: "Personality development modules",
        status: "Planned next",
        detail:
          "This can become the next points-based module after the resume builder, using student points to unlock guided development activities.",
      },
      {
        feature: "More profile-building tools",
        status: "Planned later",
        detail:
          "Future academic and career modules can read student points and unlock more profile-strengthening content.",
      },
      {
        feature: "Direct point spending",
        status: "Not live",
        detail:
          "Students cannot redeem points for money, fees, coupons, or marks right now. The current model is unlock-based, not wallet-based.",
      },
    ],
    [],
  );
  const pointsGuidelines = useMemo(
    () => [
      {
        step: "Attendance and consistency",
        rule:
          "This category carries 25 points. Coverage gives up to 15 points, each qualified month gives 1 point up to 5, and the current-month streak tier gives up to 5.",
        meaning: `Live now. You currently have ${formatPointsPair(
          attendanceCategory.earnedPoints,
          attendanceCategory.maxPoints,
        )} in this category.`,
      },
      {
        step: "Assignments",
        rule:
          "Assignments will carry 20 points in total: on-time submission up to 10, completion rate up to 5, and marks or quality up to 5.",
        meaning:
          "Reserved in the system now. It will start contributing when assignment submission and grading data exist in the portal.",
      },
      {
        step: "Class tests",
        rule:
          "Class tests will carry 25 points: average performance up to 15, consistency up to 5, and improvement trend up to 5.",
        meaning:
          "Reserved in the system now. It will start contributing when class test records are added to the portal.",
      },
      {
        step: "Results",
        rule:
          "Results will carry 30 points: result percentage up to 20, pass-all-subjects bonus up to 5, and high-performance bonus up to 5.",
        meaning:
          "Reserved in the system now. It will start contributing when result data is published in the portal.",
      },
      {
        step: "Current live ranking",
        rule:
          "The leaderboard on this page is still driven by the live attendance engine until assignments, class tests, and results become active categories.",
        meaning:
          "This keeps current ranking visible without inventing academic data that does not exist in the portal yet.",
      },
    ],
    [
      attendanceCategory.earnedPoints,
      attendanceCategory.maxPoints,
    ],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#eff6ff_24%,#f8fafc_58%,#f8fafc_100%)]">
      <div className="border-b border-white/70 bg-[radial-gradient(circle_at_top_left,#fffbeb_0%,#ffffff_46%,#eef2ff_100%)] px-4 py-6 md:px-6">
        <div className="max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Points System
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            Student Points System
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 md:text-base">
            Your student points are now divided into four categories worth 100
            total points. Attendance and consistency are live now from{" "}
            {pointsStartLabel}, while assignments, class tests, and results are
            reserved in the system and will activate when those portal modules
            start storing real records.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-4 md:p-6">
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Loading points system...
          </div>
        ) : err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
            {err}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.38)]">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Award className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm font-medium text-gray-600">
                  Overall Student Points
                </p>
                <p className="mt-2 text-4xl font-bold text-amber-700">
                  {formatPointsPair(
                    visibleOverallFrameworkPoints,
                    TOTAL_STUDENT_POINTS,
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  New 100-point structure. Right now only the attendance
                  category is live in the portal.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.38)]">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm font-medium text-gray-600">
                  Attendance Category
                </p>
                <p className="mt-2 text-4xl font-bold text-blue-700">
                  {formatPointsPair(
                    attendanceCategory.earnedPoints,
                    attendanceCategory.maxPoints,
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Coverage {attendanceCategory.coveragePoints}/15 + monthly consistency{" "}
                  {attendanceCategory.monthlyConsistencyPoints}/5 + streak{" "}
                  {attendanceCategory.streakPoints}/5
                </p>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.38)]">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Target className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm font-medium text-gray-600">
                  Live Categories
                </p>
                <p className="mt-2 text-4xl font-bold text-slate-950">
                  {liveCategories}/{pointsCategories.length}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Assignments, class tests, and results are reserved and waiting
                  for their portal records.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.38)]">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                  <Trophy className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm font-medium text-gray-600">
                  Current Live Category Rank
                </p>
                <p className="mt-2 text-4xl font-bold text-orange-700">
                  {leaderboard.yourRank ? `#${leaderboard.yourRank}` : "-"}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Live leaderboard uses attendance-category points until the
                  academic categories go live.
                </p>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,251,235,0.94),rgba(239,246,255,0.92))] p-5 shadow-[0_24px_58px_-38px_rgba(15,23,42,0.26)] md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Points Division
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    The new 100-point structure
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-gray-600">
                    The system is now divided into four clear categories. This
                    makes points harder and more balanced because attendance
                    will no longer be the only thing that matters once academic
                    records start coming into the portal.
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-3 shadow-sm lg:max-w-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Current Rollout
                  </p>
                  <p className="mt-3 text-2xl font-bold text-slate-950">
                    Attendance live now
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Academic categories are already shown to students, but they
                    start scoring only when their real portal data becomes
                    available.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {pointsCategories.map((category) => {
                  const Icon = category.icon;

                  return (
                    <div
                      key={category.key}
                      className={`rounded-[26px] border p-5 shadow-sm ${category.toneShell}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-slate-700 shadow-sm">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-lg font-semibold text-slate-950">
                              {category.label}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {category.description}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getFrameworkStatusShell(
                            category.status,
                          )}`}
                        >
                          {category.status === "live" ? "Live Now" : "Reserved"}
                        </span>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Category Points
                          </p>
                          <p className="mt-2 text-3xl font-bold text-slate-950">
                            {formatPointsPair(
                              category.earnedPoints,
                              category.maxPoints,
                            )}
                          </p>
                        </div>
                        <p className="max-w-full text-left text-xs leading-5 text-slate-500 md:max-w-[220px] md:text-right">
                          {category.status === "live"
                            ? "Contributing to the page right now"
                            : "Will activate after data for this module is stored in the portal"}
                        </p>
                      </div>

                      <div className="mt-5 space-y-3">
                        {category.rows.map((row) => (
                          <div
                            key={`${category.key}-${row.label}`}
                            className="rounded-[20px] border border-white/80 bg-white/82 px-4 py-3"
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {row.label}
                            </p>
                            <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
                              {row.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.94),rgba(254,249,195,0.88))] p-5 shadow-[0_24px_58px_-38px_rgba(37,99,235,0.24)] md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                    Use Of Points
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    What your points unlock for students right now
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-gray-600">
                    This section is now focused on the live point-based
                    functionality. Right now student points are not spent or
                    deducted. They are used to unlock resume-builder actions
                    and resume-ready achievement imports.
                  </p>
                </div>
                <div className="rounded-[24px] border border-blue-100 bg-white/90 px-4 py-3 shadow-sm lg:max-w-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Current Point Mode
                  </p>
                  <p className="mt-3 text-2xl font-bold text-slate-950">
                    Unlock, not spend
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {unlockedResumeUseCount}/{resumePointUses.length} resume
                    point use
                    {unlockedResumeUseCount === 1 ? "" : "s"} available for
                    your profile right now.
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Your live attendance category is{" "}
                    <span className="font-semibold text-amber-700">
                      {formatPointsPair(
                        attendanceCategory.earnedPoints,
                        attendanceCategory.maxPoints,
                      )}{" "}
                      right now
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900 shadow-sm">
                <span className="font-semibold">Important:</span>{" "}
                {RESUME_POINTS_UNLOCK_NOTE}
              </div>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-white/80 bg-white/86 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-[860px] text-left">
                    <thead className="bg-slate-50/90 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Resume Function</th>
                        <th className="px-4 py-3">Required Rule</th>
                        <th className="px-4 py-3">Your Status</th>
                        <th className="px-4 py-3">What Student Gets</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumePointUses.map((item) => (
                        <tr
                          key={item.feature}
                          className="border-t border-slate-100 align-top"
                        >
                          <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                            {item.feature}
                          </td>
                          <td className="px-4 py-4 text-sm leading-6 text-slate-600">
                            {item.rule}
                          </td>
                          <td className="px-4 py-4 text-sm leading-6 text-slate-600">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                                item.statusTone === "live"
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border border-amber-200 bg-amber-50 text-amber-700"
                              }`}
                            >
                              {item.yourStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm leading-6 text-slate-600">
                            {item.benefit}
                          </td>
                          <td className="px-4 py-4">
                            <Link
                              href={item.actionHref}
                              className="inline-flex items-center gap-2 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              {item.actionLabel}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-white/80 bg-white/86 shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Planned Later
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[720px] text-left">
                    <thead className="bg-white text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Future Point Use</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">What It Means</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plannedPointUses.map((item) => (
                        <tr
                          key={item.feature}
                          className="border-t border-slate-100 align-top"
                        >
                          <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                            {item.feature}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm leading-6 text-slate-600">
                            {item.detail}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div
              id="points-guidelines"
              className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,251,235,0.94),rgba(239,246,255,0.92))] p-5 shadow-[0_24px_58px_-38px_rgba(217,119,6,0.24)] md:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                    Guideline
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Clear guide to how points are distributed
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-gray-600">
                    Students should be able to understand this page without
                    guessing. The table below explains the full category-based
                    structure in plain language, and the tier chips show the
                    live attendance thresholds already working inside the page.
                  </p>
                </div>
                <div className="rounded-[24px] border border-amber-100 bg-white/90 px-4 py-3 shadow-sm lg:max-w-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Current Snapshot
                  </p>
                  <p className="mt-3 text-2xl font-bold text-slate-950">
                    {formatPointsPair(
                      visibleOverallFrameworkPoints,
                      TOTAL_STUDENT_POINTS,
                    )}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Overall student points visible now. Only the attendance
                    category is currently active inside the portal.
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-white/80 bg-white/86 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-[720px] text-left">
                    <thead className="bg-slate-50/90 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">How It Works</th>
                        <th className="px-4 py-3">Student View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointsGuidelines.map((item) => (
                        <tr
                          key={item.step}
                          className="border-t border-slate-100 align-top"
                        >
                          <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                            {item.step}
                          </td>
                          <td className="px-4 py-4 text-sm leading-6 text-slate-600">
                            {item.rule}
                          </td>
                          <td className="px-4 py-4 text-sm leading-6 text-slate-600">
                            {item.meaning}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Coverage Point Examples
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Coverage points are not fixed bonus tiers now. They are
                    calculated with the formula:
                    <span className="font-semibold text-slate-950">
                      {" "}
                      round((coverage % / 100) * 15)
                    </span>
                    .
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {ATTENDANCE_COVERAGE_EXAMPLES.map((tier) => (
                      <div
                        key={tier.threshold}
                        className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-slate-950">
                          {tier.threshold}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                          {tier.points}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Monthly Consistency Credit
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Every month with
                    <span className="font-semibold text-slate-950"> 75%+ </span>
                    attendance coverage counts as
                    <span className="font-semibold text-slate-950">
                      {" "}
                      1 category point
                    </span>
                    , up to 5.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {MONTHLY_CONSISTENCY_TIERS.map((tier) => (
                      <div
                        key={tier.threshold}
                        className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-slate-950">
                          {tier.threshold}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          {tier.points}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm xl:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                    Current Month Streak Tiers
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The streak part now uses category points, not the old large
                    bonus values.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {ATTENDANCE_STREAK_TIERS.map((tier) => (
                      <div
                        key={tier.threshold}
                        className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-slate-950">
                          {tier.threshold}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                          {tier.points}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,251,235,0.96),rgba(239,246,255,0.9))] p-5 shadow-[0_24px_58px_-38px_rgba(217,119,6,0.28)] md:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                    Growth Tools
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Resume Builder inside your student points section
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-gray-600">
                    Turn your student profile, projects, certifications, and
                    student-point achievements into a professional resume with a
                    live preview, template switcher, and PDF download layout.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/dashboard/student/points/resume"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
                  >
                    <FileText className="h-4 w-4" />
                    {resumeBuilderUnlocked
                      ? "Open Resume Builder"
                      : "Open Resume Preview"}
                  </Link>
                  <Link
                    href={
                      resumeBuilderUnlocked
                        ? "/dashboard/student/points/resume"
                        : "/dashboard/student/points#points-guidelines"
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
                  >
                    {resumeBuilderUnlocked
                      ? "Import Achievements"
                      : "See Unlock Guide"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,251,235,0.96),rgba(239,246,255,0.9))] p-5 shadow-[0_24px_58px_-38px_rgba(217,119,6,0.28)] md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                      Live Attendance Category Breakdown
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      How the live attendance category is built right now
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                      This section shows the current live attendance engine that
                      still powers the ranking below. It is separate from the
                      new 100-point structure and stays active until assignment,
                      class test, and result modules start contributing their
                      own data.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getLeaderboardTitleShell(
                      leaderboard.yourTitle,
                    )}`}
                  >
                    {leaderboard.yourTitle}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Coverage Score
                    </p>
                    <p className="mt-3 text-3xl font-bold text-slate-950">
                      {attendanceCategory.coveragePoints}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Up to 15 points from attendance coverage since{" "}
                      {pointsStartLabel}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Monthly Consistency
                    </p>
                    <p className="mt-3 text-3xl font-bold text-blue-700">
                      {attendanceCategory.monthlyConsistencyPoints}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {attendanceCategory.bonusMonthsCount} qualified month
                      {attendanceCategory.bonusMonthsCount === 1 ? "" : "s"}{" "}
                      counted, up to 5 category points
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Streak-Tier Score
                    </p>
                    <p className="mt-3 text-3xl font-bold text-orange-700">
                      {attendanceCategory.streakPoints}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Best current-month streak is {attendanceCategory.bestStreak},
                      with up to 5 category points
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[24px] border border-white/80 bg-white/82 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    {leaderboard.motivation ||
                      "Attend regularly to improve your points rank."}
                  </p>
                  {leaderboard.scoreGapToNextRank > 0 ? (
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {formatLeaderboardScore(leaderboard.scoreGapToNextRank)}{" "}
                      more category point
                      {Number(leaderboard.scoreGapToNextRank) === 1 ? "" : "s"}{" "}
                      will move you closer to the next rank.
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/dashboard/student/attendance"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
                  >
                    Open Attendance
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.95),rgba(254,249,195,0.9))] p-5 shadow-[0_24px_58px_-38px_rgba(59,130,246,0.24)] md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                      Monthly Consistency View
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Attendance category credit by month
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                      Each tracked month from {pointsStartLabel} onward can add
                      one monthly consistency point to the attendance category
                      when attendance coverage for that month reaches 75% or
                      higher.
                    </p>
                  </div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <Flame className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {monthlyBonuses.length ? (
                    monthlyBonuses.map((month) => (
                      <div
                        key={month.monthKey}
                        className="rounded-[22px] border border-white/80 bg-white/84 px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {month.label}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Present {month.present} of {month.workingDays} working
                              days | {month.absent} marked absent
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-blue-700">
                              {month.confirmedPercentage}%
                            </p>
                            <p
                              className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                Number(month.scoreBonus || 0) > 0
                                  ? "text-emerald-700"
                                  : "text-slate-500"
                              }`}
                            >
                              {Number(month.scoreBonus || 0) > 0
                                ? "+1 category pt"
                                : "No category point"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-white/80 bg-white/84 px-4 py-5 text-sm text-gray-500 shadow-sm">
                      Monthly bonus history will appear once marked attendance is
                      available from {pointsStartLabel}.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.95),rgba(243,232,255,0.92))] p-5 shadow-[0_24px_50px_-38px_rgba(37,99,235,0.35)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                      Attendance Leaderboard
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Top 5 live attendance-category leaders
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      This ranking is still based on the live attendance engine.
                      It will broaden into the full academic points model after
                      the other categories start storing data.
                    </p>
                  </div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <Trophy className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {hasLeaderboardData ? (
                    topStudents.map((student) => (
                      <div
                        key={`${student.rank}-${student.studentId}`}
                        className={`rounded-[24px] border px-4 py-3 shadow-sm ${getLeaderboardRowShell(
                          student.rank,
                          student.isCurrentUser,
                        )}`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <ProfileAvatar
                              src={student.profileImage}
                              name={student.name}
                              sizeClass="h-11 w-11"
                              className="border-white/80"
                              textClassName="text-xs"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-5 text-slate-950">
                                <span
                                  className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${getLeaderboardRankShell(
                                    student.rank,
                                    student.isCurrentUser,
                                  )}`}
                                >
                                  {getLeaderboardRankLabel(student.rank)}
                                </span>
                                <span className="break-words">
                                  {student.isCurrentUser
                                    ? `YOU - ${student.name}`
                                    : student.name}
                                </span>
                              </p>
                              <p className="mt-1 break-words text-[11px] font-medium text-gray-500">
                                {student.course} • Year {student.year}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getLeaderboardTitleShell(
                                    student.title,
                                  )}`}
                                >
                                  {student.title}
                                </span>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getLeaderboardTierShell(
                                    student.tierTone,
                                    student.tierIsLive,
                                  )}`}
                                >
                                  {student.tierLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-full text-left sm:w-auto sm:max-w-[180px] sm:shrink-0 sm:text-right">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Attendance Category
                            </p>
                            <p className="mt-2 text-lg font-bold text-slate-950">
                              {formatPointsPair(
                                student.attendanceCategoryPoints ??
                                  student.attendanceScore,
                                student.attendanceCategoryBreakdown?.maxPoints || 25,
                              )}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-500">
                              {formatLeaderboardPercentage(
                                student.confirmedOverallPercentage,
                              )}{" "}
                              coverage in the live category
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-white/80 bg-white/82 px-4 py-5 text-sm text-gray-500 shadow-sm">
                      Students will appear here once points data is available.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.92),rgba(239,246,255,0.9))] p-5 shadow-[0_24px_50px_-38px_rgba(16,185,129,0.32)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                      Near You
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Students around your live attendance-category rank
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Track the students just above and below you while the full
                      academic categories are still being rolled out.
                    </p>
                  </div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Sparkles className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {hasLeaderboardData ? (
                    nearbyStudents.map((student) => (
                      <div
                        key={`nearby-${student.rank}-${student.studentId}`}
                        className={`rounded-[24px] border px-4 py-3 shadow-sm ${getLeaderboardRowShell(
                          student.rank,
                          student.isCurrentUser,
                        )}`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <ProfileAvatar
                              src={student.profileImage}
                              name={student.name}
                              sizeClass="h-10 w-10"
                              className="border-white/80"
                              textClassName="text-[11px]"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-5 text-slate-950">
                                <span
                                  className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${getLeaderboardRankShell(
                                    student.rank,
                                    student.isCurrentUser,
                                  )}`}
                                >
                                  {getLeaderboardRankLabel(student.rank)}
                                </span>
                                <span className="break-words">
                                  {student.isCurrentUser
                                    ? `YOU - ${student.name}`
                                    : student.name}
                                </span>
                              </p>
                              <p className="mt-1 break-words text-[11px] font-medium text-gray-500">
                                {student.course} • Year {student.year}
                              </p>
                              <p className="mt-1 break-words text-[11px] font-medium text-gray-500">
                                {getLeaderboardTierNote(student)}
                              </p>
                            </div>
                          </div>
                          <div className="w-full text-left sm:w-auto sm:shrink-0 sm:text-right">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getLeaderboardTierShell(
                                student.tierTone,
                                student.tierIsLive,
                              )}`}
                            >
                              {student.tierLabel}
                            </span>
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Attendance Category
                            </p>
                            <p className="mt-2 text-lg font-bold text-slate-950">
                              {formatPointsPair(
                                student.attendanceCategoryPoints ??
                                  student.attendanceScore,
                                student.attendanceCategoryBreakdown?.maxPoints || 25,
                              )}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-500">
                              {formatLeaderboardPercentage(
                                student.confirmedOverallPercentage,
                              )}{" "}
                              coverage in the live category
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-white/80 bg-white/82 px-4 py-5 text-sm text-gray-500 shadow-sm">
                      Nearby ranking will appear once points data is available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
