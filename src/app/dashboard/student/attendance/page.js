"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Flame,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import AttendancePerformanceChart from "../../_components/AttendancePerformanceChart";

const ATTENDANCE_START_MONTH = "2026-01";
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function getDaysInMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function getMonthStartDay(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).getDay();
}

function getStatusClasses(status) {
  switch (status) {
    case "future":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "present":
      return "border-green-200 bg-green-50 text-green-800";
    case "absent":
      return "border-red-200 bg-red-50 text-red-800";
    case "internship":
      return "border-cyan-200 bg-cyan-50 text-cyan-800";
    case "event":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "holiday":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "vacation":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-gray-200 bg-white text-gray-700";
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "future":
      return "Upcoming";
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "internship":
      return "Internship";
    case "event":
      return "Event";
    case "holiday":
      return "Holiday";
    case "vacation":
      return "Vacation";
    default:
      return "Not Marked";
  }
}

function getBadgeStyles(tone, unlocked) {
  if (!unlocked) {
    return {
      card: "border-gray-200 bg-white text-gray-500",
      chip: "bg-gray-100 text-gray-500",
      icon: "bg-gray-100 text-gray-400",
    };
  }

  if (tone === "emerald") {
    return {
      card: "border-emerald-200 bg-emerald-50 text-emerald-900",
      chip: "bg-emerald-100 text-emerald-700",
      icon: "bg-emerald-100 text-emerald-700",
    };
  }

  if (tone === "amber") {
    return {
      card: "border-amber-200 bg-amber-50 text-amber-900",
      chip: "bg-amber-100 text-amber-700",
      icon: "bg-amber-100 text-amber-700",
    };
  }

  if (tone === "indigo") {
    return {
      card: "border-indigo-200 bg-indigo-50 text-indigo-900",
      chip: "bg-indigo-100 text-indigo-700",
      icon: "bg-indigo-100 text-indigo-700",
    };
  }

  if (tone === "rose") {
    return {
      card:
        "border-rose-200 bg-[linear-gradient(135deg,rgba(255,241,242,0.98),rgba(255,255,255,0.96),rgba(254,243,199,0.94))] text-rose-900",
      chip: "bg-gradient-to-r from-rose-100 to-amber-100 text-rose-700",
      icon: "bg-gradient-to-br from-rose-100 to-amber-100 text-rose-700",
    };
  }

  if (tone === "violet") {
    return {
      card: "border-violet-200 bg-violet-50 text-violet-900",
      chip: "bg-violet-100 text-violet-700",
      icon: "bg-violet-100 text-violet-700",
    };
  }

  return {
    card: "border-sky-200 bg-sky-50 text-sky-900",
    chip: "bg-sky-100 text-sky-700",
    icon: "bg-sky-100 text-sky-700",
  };
}

function getBadgeIcon(icon) {
  if (icon === "trophy") {
    return Trophy;
  }

  if (icon === "award") {
    return Award;
  }

  return Flame;
}

function formatBadgeProgress(badge) {
  return `${Math.min(badge.progress, badge.target)}/${badge.target} days`;
}

export default function StudentAttendancePage() {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const maxMonthKey = useMemo(() => {
    const endDate = summary?.calendarEndDate || summary?.currentDate;
    return endDate ? endDate.slice(0, 7) : getCurrentMonthKey();
  }, [summary]);

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
          throw new Error(data.message || "Failed to load attendance");
        }

        setSummary(data);

        const latestMonthKey = data?.calendarEndDate
          ? data.calendarEndDate.slice(0, 7)
          : getCurrentMonthKey();

        if (monthKey < ATTENDANCE_START_MONTH || monthKey > latestMonthKey) {
          setMonthKey(latestMonthKey);
        }
      } catch (error) {
        setErr(error.message || "Error");
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [monthKey]);

  const selectedMonthStats = useMemo(() => {
    return (
      summary?.months?.find((item) => item.monthKey === monthKey) || {
        monthKey,
        label: getMonthLabel(monthKey),
        workingDays: 0,
        markedDays: 0,
        present: 0,
        absent: 0,
        percentage: 0,
      }
    );
  }, [summary, monthKey]);

  const calendarMap = useMemo(() => {
    const map = new Map();
    (summary?.calendar || []).forEach((item) => {
      if (item.monthKey === monthKey) {
        map.set(item.day, item);
      }
    });
    return map;
  }, [summary, monthKey]);

  const monthGrid = useMemo(() => {
    const startDay = getMonthStartDay(monthKey);
    const totalDays = getDaysInMonth(monthKey);
    const cells = [];

    for (let i = 0; i < startDay; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(calendarMap.get(day) || { day, status: "not_marked", note: "" });
    }

    return cells;
  }, [calendarMap, monthKey]);

  const overall = summary?.overall || {
    workingDays: 0,
    markedDays: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  };
  const streaks = summary?.streaks || {
    current: 0,
    best: 0,
  };
  const streakProgress = summary?.streakProgress || {
    current: 0,
    previousTarget: 0,
    target: 3,
    nextTarget: 3,
    percent: 0,
    message: "Start attending regularly this month to build your streak.",
    resetsOnAbsent: true,
  };
  const badges = summary?.badges || [];
  const earnedBadgeCount = badges.filter((badge) => badge.unlocked).length;
  const nextBadge = badges.find((badge) => !badge.unlocked);
  const streakMonthLabel = summary?.streakMonthLabel || getMonthLabel(getCurrentMonthKey());

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eef2ff_22%,#f8fafc_56%,#f8fafc_100%)]">
      <div className="border-b border-white/70 bg-[radial-gradient(circle_at_top_left,#eff6ff_0%,#ffffff_48%,#eef2ff_100%)] px-4 py-6 md:px-6">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-blue-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Smart Attendance
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            My Attendance
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 md:text-base">
            Attendance is tracked from January 1, 2026 to today. Winter vacation
            from January 1 to January 18, 2026 is excluded, Sundays are
            treated as holidays, and saved future events appear in upcoming months.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92),rgba(236,253,245,0.88))] p-4 shadow-[0_26px_70px_-44px_rgba(15,23,42,0.45)] backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Attendance Rules
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Smart Attendance Calendar
              </h2>
              <p className="mt-2 text-sm leading-7 text-gray-600">
                Winter vacation dates and Sundays are excluded from working-day
                attendance tracking.
              </p>
            </div>

            <div className="w-full max-w-xs rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Month
              </label>
              <input
                type="month"
                min={ATTENDANCE_START_MONTH}
                max={maxMonthKey}
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Loading attendance summary...
          </div>
        ) : err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
            {err}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-5">
              <div className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)] md:p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-gray-600">
                  {selectedMonthStats.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {selectedMonthStats.percentage}%
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Monthly attendance percentage
                </p>
              </div>

              <div className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)] md:p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-gray-600">
                  Overall Attendance
                </p>
                <p className="mt-2 text-3xl font-bold text-blue-700">
                  {overall.percentage}%
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  From January 2026 to current date
                </p>
              </div>

              <div className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)] md:p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                  <CalendarRange className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-gray-600">Working Days</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {selectedMonthStats.workingDays}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Sundays and vacation excluded
                </p>
              </div>

              <div className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)] md:p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {selectedMonthStats.present}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Marked present this month
                </p>
              </div>

              <div className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)] md:p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {selectedMonthStats.absent}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Marked absent this month
                </p>
              </div>
            </div>

            <AttendancePerformanceChart
              months={summary?.months || []}
              selectedMonthKey={monthKey}
              title="Attendance Performance Graph"
              subtitle="See how your attendance percentage is moving month by month and quickly understand your best and weakest periods."
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.25fr]">
              <div className="rounded-[28px] border border-orange-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,247,237,0.96),rgba(254,242,242,0.95))] p-5 shadow-[0_20px_44px_-34px_rgba(249,115,22,0.45)] md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
                      Attendance Streak
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Keep the monthly chain alive
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                      This streak ladder always follows {streakMonthLabel}. Only
                      working days count, while Sundays, vacations, holidays,
                      internships, and approved off-days are skipped automatically.
                    </p>
                  </div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                    <Flame className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Live This Month
                    </p>
                    <p className="mt-3 text-4xl font-bold text-orange-600">
                      {streaks.current}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      present working days in a row
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Best This Month
                    </p>
                    <p className="mt-3 text-4xl font-bold text-violet-700">
                      {streaks.best}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      highest run in {streakMonthLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {streakProgress.nextTarget
                        ? `Progress to ${streakProgress.nextTarget}-day tier`
                        : "Premium streak tier"}
                    </p>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                      {streakProgress.percent}%
                    </span>
                  </div>
                  <div className="relative mt-3 h-12">
                    <div className="absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 rounded-full bg-orange-100" />
                    <div
                      className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(100, streakProgress.percent))}%` }}
                    >
                      {streakProgress.percent > 0 && (
                        <span className="pointer-events-none absolute right-[-18px] top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center">
                          <span className="absolute inset-[8px] rounded-full bg-orange-300/75 blur-lg animate-pulse" />
                          <Flame className="relative h-10 w-10 animate-pulse fill-orange-500 text-orange-500 drop-shadow-[0_10px_22px_rgba(15,23,42,0.18)]" />
                          <span className="hidden">
                            🔥
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {streakProgress.message}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Only a working-day absence resets the live streak. Holidays,
                    Sundays, vacations, internships, and other off-days are skipped.
                    This card stays tied to {streakMonthLabel} even when you browse
                    another month in the calendar.
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.95),rgba(243,232,255,0.92))] p-5 shadow-[0_24px_50px_-38px_rgba(37,99,235,0.45)] md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                      Badge Cabinet
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Monthly streak rewards
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-gray-600">
                      The badge order follows the current-month tier ladder from
                      Amber Ember to Rose Crown.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Unlocked
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">
                      {earnedBadgeCount}
                      <span className="ml-1 text-sm font-medium text-gray-500">
                        / {badges.length || 6}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {badges.map((badge) => {
                    const styles = getBadgeStyles(badge.tone, badge.unlocked);
                    const BadgeIcon = getBadgeIcon(badge.icon);

                    return (
                      <div
                        key={badge.key}
                        className={`rounded-[24px] border p-4 shadow-sm ${styles.card}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${styles.icon}`}
                          >
                            <BadgeIcon className="h-4 w-4" />
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${styles.chip}`}
                          >
                            {badge.unlocked ? "Unlocked" : "In Progress"}
                          </span>
                        </div>

                        <p className="mt-4 text-base font-semibold text-gray-900">
                          {badge.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-gray-600">
                          {badge.description}
                        </p>
                        <p className="mt-3 text-[11px] font-semibold text-gray-500">
                          {formatBadgeProgress(badge)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {nextBadge ? (
                  <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">
                      Next badge: {nextBadge.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {nextBadge.description} Progress: {formatBadgeProgress(nextBadge)}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
                    <p className="text-sm font-semibold text-emerald-800">
                      You have unlocked every monthly streak badge for now.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                      Keep your current streak active and protect that premium tier.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Attendance Calendar
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedMonthStats.label}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
                      Present
                    </span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">
                      Upcoming
                    </span>
                    <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
                      Absent
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                      Vacation
                    </span>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 font-medium text-cyan-700">
                      Internship
                    </span>
                    <span className="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700">
                      Event
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      Sunday
                    </span>
                  </div>
                </div>

                <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                  <div className="min-w-[720px]">
                    <div className="grid grid-cols-7 gap-2 md:gap-3">
                      {WEEK_DAYS.map((day) => (
                        <div
                          key={day}
                          className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 md:text-xs"
                        >
                          {day}
                        </div>
                      ))}

                      {monthGrid.map((item, index) =>
                        item ? (
                          <div
                            key={`${monthKey}-${item.day}-${index}`}
                            className={`min-h-[80px] rounded-xl border p-2.5 md:min-h-[88px] md:p-3 ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-bold">{item.day}</span>
                              <span className="text-[9px] font-semibold uppercase tracking-wide md:text-[10px]">
                                {getStatusLabel(item.status)}
                              </span>
                            </div>
                            {item.note && (
                              <p className="mt-2 text-[10px] leading-4 md:mt-3 md:text-[11px]">
                                {item.note}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div
                            key={`${monthKey}-empty-${index}`}
                            className="min-h-[80px] rounded-xl border border-transparent md:min-h-[88px]"
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Overall Summary
                  </h2>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <span className="text-sm text-gray-600">Working Days</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {overall.workingDays}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <span className="text-sm text-gray-600">Marked Days</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {overall.markedDays}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <span className="text-sm text-gray-600">Present</span>
                      <span className="text-sm font-semibold text-green-700">
                        {overall.present}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <span className="text-sm text-gray-600">Absent</span>
                      <span className="text-sm font-semibold text-red-700">
                        {overall.absent}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Monthly Percentages
                  </h2>
                  <div className="mt-4 space-y-3">
                    {(summary?.months || []).map((month) => (
                      <div
                        key={month.monthKey}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {month.label}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Present {month.present} | Absent {month.absent} |
                              {" "}Working {month.workingDays}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-blue-700">
                            {month.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {overall.markedDays > 0 && overall.percentage < 75 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Attendance Warning
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Your overall attendance is below the required 75%.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
