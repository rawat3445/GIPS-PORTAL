"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FlameAvatar from "../../components/FlameAvatar";
import {
  Activity,
  AlertCircle,
  Award,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  FileClock,
  Receipt,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";

function toISODate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// current month range (YYYY-MM-DD)
function getMonthRange(date = new Date()) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { from: toISODate(first), to: toISODate(last) };
}

function getGreetingByTime() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function buildAssistantMessage({
  me,
  todayStatus,
  monthSummary,
  overallPercentage,
}) {
  const firstName = me?.name?.trim()?.split(" ")[0] || "Student";

  if (todayStatus === "absent") {
    return {
      title: `${getGreetingByTime()}, ${firstName}.`,
      message:
        "You are marked absent today. Try to stay regular in class so your attendance does not drop further.",
      tone: "red",
    };
  }

  if (overallPercentage >= 85) {
    return {
      title: `${getGreetingByTime()}, ${firstName}.`,
      message:
        "Your attendance is looking excellent. Keep this momentum going and stay consistent in every class.",
      tone: "green",
    };
  }

  if (overallPercentage >= 75) {
    return {
      title: `${getGreetingByTime()}, ${firstName}.`,
      message:
        "You are doing well overall. A few more present days this month will help you stay safely above the target.",
      tone: "blue",
    };
  }

  if (monthSummary.total === 0) {
    return {
      title: `${getGreetingByTime()}, ${firstName}.`,
      message:
        "Your attendance for this month has not been marked much yet. Keep checking in and stay prepared for upcoming classes.",
      tone: "amber",
    };
  }

  return {
    title: `${getGreetingByTime()}, ${firstName}.`,
    message:
      "Your attendance needs attention right now. Attend upcoming classes regularly to improve your overall percentage.",
    tone: "amber",
  };
}

function getAssistantClasses(tone) {
  if (tone === "green") {
    return "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50";
  }

  if (tone === "red") {
    return "border-red-200 bg-gradient-to-r from-red-50 to-rose-50";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50";
  }

  return "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50";
}

function getComingSoonAccent(accent) {
  if (accent === "emerald") {
    return {
      border: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-500",
      glow: "from-emerald-50 via-white to-teal-50",
    };
  }

  if (accent === "amber") {
    return {
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
      glow: "from-amber-50 via-white to-yellow-50",
    };
  }

  return {
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    glow: "from-blue-50 via-white to-indigo-50",
  };
}

function ComingSoonCard({ title, description, icon: Icon, accent = "blue" }) {
  const styles = getComingSoonAccent(accent);

  return (
    <div
      className={`group relative overflow-hidden rounded-[28px] border bg-gradient-to-br ${styles.glow} p-5 shadow-[0_24px_55px_-35px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 ${styles.border}`}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-white/40 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/85 text-gray-700 shadow-sm">
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </span>
          <p className="mt-4 text-base font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] shadow-sm ${styles.badge}`}
        >
          Working on it
        </span>
      </div>

      <div className="relative mt-5 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${styles.dot} animate-bounce`}
        />
        <span
          className={`h-2.5 w-2.5 rounded-full ${styles.dot} animate-bounce`}
          style={{ animationDelay: "120ms" }}
        />
        <span
          className={`h-2.5 w-2.5 rounded-full ${styles.dot} animate-bounce`}
          style={{ animationDelay: "240ms" }}
        />
      </div>

      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/80">
        <div
          className={`h-full w-2/3 rounded-full ${styles.dot} animate-pulse`}
        />
      </div>

      <div className="relative mt-5 flex items-center justify-between rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-xs font-medium text-gray-600 shadow-sm">
        <span>Preview in progress</span>
        <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}

function buildActiveBadgeStyles({
  cardGlow,
  glow,
  chip,
  icon,
  meta,
  note,
}) {
  return {
    card: `relative isolate overflow-hidden border bg-white/98 text-slate-900 ring-2 scale-[1.02] ${cardGlow}`,
    glow: `absolute inset-x-4 top-3 h-20 rounded-full blur-2xl opacity-100 animate-pulse ${glow}`,
    veil: "hidden",
    chip: `${chip} shadow-sm`,
    icon: `${icon} shadow-[0_10px_24px_-18px_rgba(15,23,42,0.9)]`,
    title: "text-slate-950",
    body: "text-slate-700",
    meta,
    note,
  };
}

function buildEarnedBadgeStyles({
  card,
  chip,
  icon,
  meta,
  note,
}) {
  return {
    card: `relative isolate overflow-hidden border shadow-none ${card}`,
    glow: "hidden",
    veil: "absolute inset-0 bg-white/35",
    chip,
    icon,
    title: "text-slate-800",
    body: "text-slate-600",
    meta,
    note,
  };
}

function getBadgeStyles(tone, unlocked, isCurrentTier) {
  if (!unlocked) {
    return {
      card: "border-slate-200 bg-slate-50/80 text-slate-400 opacity-75 saturate-0 shadow-none",
      glow: "hidden",
      chip: "border border-slate-200 bg-slate-100 text-slate-500",
      icon: "bg-slate-100 text-slate-400",
      title: "text-slate-600",
      body: "text-slate-500",
      meta: "text-slate-500",
      note: "text-slate-500",
    };
  }

  if (tone === "emerald") {
    return isCurrentTier
      ? buildActiveBadgeStyles({
          cardGlow:
            "border-emerald-200/90 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(255,255,255,0.98),rgba(209,250,229,0.96))] ring-emerald-300/90 shadow-[0_30px_80px_-26px_rgba(5,150,105,0.52)]",
          glow: "bg-emerald-200/80",
          chip: "bg-emerald-100 text-emerald-700 animate-pulse",
          icon: "bg-emerald-100 text-emerald-700",
          meta: "text-emerald-700",
          note: "text-emerald-700",
        })
      : buildEarnedBadgeStyles({
          card: "border-emerald-200 bg-emerald-50/85 text-emerald-800",
          chip: "border border-emerald-200 bg-white/85 text-emerald-700",
          icon: "bg-emerald-100/90 text-emerald-700 opacity-75",
          meta: "text-emerald-700",
          note: "text-emerald-700",
        });
  }

  if (tone === "amber") {
    return isCurrentTier
      ? buildActiveBadgeStyles({
          cardGlow:
            "border-amber-200/90 bg-[linear-gradient(135deg,rgba(255,251,235,0.99),rgba(255,255,255,0.98),rgba(254,243,199,0.96))] ring-amber-300/90 shadow-[0_30px_80px_-26px_rgba(245,158,11,0.5)]",
          glow: "bg-amber-200/80",
          chip: "bg-amber-100 text-amber-700 animate-pulse",
          icon: "bg-amber-100 text-amber-700",
          meta: "text-amber-700",
          note: "text-amber-700",
        })
      : buildEarnedBadgeStyles({
          card: "border-amber-200 bg-amber-50/85 text-amber-900",
          chip: "border border-amber-200 bg-white/85 text-amber-700",
          icon: "bg-amber-100/90 text-amber-700 opacity-75",
          meta: "text-amber-700",
          note: "text-amber-700",
        });
  }

  if (tone === "indigo") {
    return isCurrentTier
      ? buildActiveBadgeStyles({
          cardGlow:
            "border-indigo-200/90 bg-[linear-gradient(135deg,rgba(238,242,255,0.99),rgba(255,255,255,0.98),rgba(224,231,255,0.96))] ring-indigo-300/90 shadow-[0_30px_80px_-26px_rgba(99,102,241,0.54)]",
          glow: "bg-indigo-200/80",
          chip: "bg-indigo-100 text-indigo-700 animate-pulse",
          icon: "bg-indigo-100 text-indigo-700",
          meta: "text-indigo-700",
          note: "text-indigo-700",
        })
      : buildEarnedBadgeStyles({
          card: "border-indigo-200 bg-indigo-50/85 text-indigo-900",
          chip: "border border-indigo-200 bg-white/85 text-indigo-700",
          icon: "bg-indigo-100/90 text-indigo-700 opacity-75",
          meta: "text-indigo-700",
          note: "text-indigo-700",
        });
  }

  if (tone === "rose") {
    return isCurrentTier
      ? buildActiveBadgeStyles({
          cardGlow:
            "border-rose-200/90 bg-[linear-gradient(135deg,rgba(255,241,242,0.99),rgba(255,255,255,0.98),rgba(254,243,199,0.96))] ring-rose-300/90 shadow-[0_30px_80px_-26px_rgba(244,63,94,0.52)]",
          glow: "bg-rose-200/80",
          chip: "bg-gradient-to-r from-rose-100 to-amber-100 text-rose-700 animate-pulse",
          icon: "bg-gradient-to-br from-rose-100 to-amber-100 text-rose-700",
          meta: "text-rose-700",
          note: "text-rose-700",
        })
      : buildEarnedBadgeStyles({
          card:
            "border-rose-200 bg-[linear-gradient(135deg,rgba(255,241,242,0.92),rgba(255,255,255,0.92),rgba(254,243,199,0.86))] text-rose-900",
          chip: "border border-rose-200 bg-white/85 text-rose-700",
          icon: "bg-gradient-to-br from-rose-100/90 to-amber-100/90 text-rose-700 opacity-75",
          meta: "text-rose-700",
          note: "text-rose-700",
        });
  }

  if (tone === "violet") {
    return isCurrentTier
      ? buildActiveBadgeStyles({
          cardGlow:
            "border-violet-200/90 bg-[linear-gradient(135deg,rgba(245,243,255,0.99),rgba(255,255,255,0.98),rgba(233,213,255,0.96))] ring-violet-300/90 shadow-[0_30px_80px_-26px_rgba(139,92,246,0.54)]",
          glow: "bg-violet-200/80",
          chip: "bg-violet-100 text-violet-700 animate-pulse",
          icon: "bg-violet-100 text-violet-700",
          meta: "text-violet-700",
          note: "text-violet-700",
        })
      : buildEarnedBadgeStyles({
          card: "border-violet-200 bg-violet-50/85 text-violet-900",
          chip: "border border-violet-200 bg-white/85 text-violet-700",
          icon: "bg-violet-100/90 text-violet-700 opacity-75",
          meta: "text-violet-700",
          note: "text-violet-700",
        });
  }

  return isCurrentTier
    ? buildActiveBadgeStyles({
        cardGlow:
          "border-sky-200/90 bg-[linear-gradient(135deg,rgba(240,249,255,0.99),rgba(255,255,255,0.98),rgba(224,242,254,0.96))] ring-sky-300/90 shadow-[0_30px_80px_-26px_rgba(14,165,233,0.52)]",
        glow: "bg-sky-200/80",
        chip: "bg-sky-100 text-sky-700 animate-pulse",
        icon: "bg-sky-100 text-sky-700",
        meta: "text-sky-700",
        note: "text-sky-700",
      })
    : buildEarnedBadgeStyles({
        card: "border-sky-200 bg-sky-50/85 text-sky-900",
        chip: "border border-sky-200 bg-white/85 text-sky-700",
        icon: "bg-sky-100/90 text-sky-700 opacity-75",
        meta: "text-sky-700",
        note: "text-sky-700",
      });
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

function getBadgeStatusLabel(badge) {
  if (badge.isCurrentTier) {
    return "Current Tier";
  }

  if (badge.unlocked) {
    return "Unlocked";
  }

  return "In Progress";
}

function getBadgeStatusNote(badge) {
  if (badge.isCurrentTier) {
    return "This tier is active right now.";
  }

  if (badge.unlocked) {
    return "Earned earlier this month and kept in your cabinet.";
  }

  const daysLeft = Math.max(
    0,
    badge.target - Math.min(Number(badge.progress || 0), badge.target),
  );
  return `${daysLeft} more day${
    daysLeft === 1 ? "" : "s"
  } needed to unlock this tier.`;
}

function getStreakNote(currentStreak) {
  if (currentStreak >= 25) {
    return "Rose Crown tier is live now. You are in the premium zone for this month.";
  }

  if (currentStreak >= 15) {
    return "Indigo Elite is active. One strong push can carry you into the premium tier.";
  }

  if (currentStreak >= 10) {
    return "Emerald Core means this month is already looking seriously consistent.";
  }

  if (currentStreak >= 6) {
    return "Violet Rhythm is unlocked. Keep stacking confirmed present days this month.";
  }

  if (currentStreak >= 3) {
    return "Sky Surge has started. A little more consistency will move you into the stronger tiers.";
  }

  return "Amber Ember is your starting zone. Holidays, Sundays, internships, and off-days never break it.";
}
function getProfileThemeTone(currentStreak) {
  if (currentStreak >= 25) {
    return "rose";
  }

  if (currentStreak >= 15) {
    return "indigo";
  }

  if (currentStreak >= 10) {
    return "emerald";
  }

  if (currentStreak >= 6) {
    return "violet";
  }

  if (currentStreak >= 3) {
    return "sky";
  }

  return "amber";
}

function getProfileStreakTheme(tone) {
  if (tone === "emerald") {
    return {
      key: "emerald",
      shell: "from-emerald-100 via-white to-lime-100",
      avatarClass:
        "border-emerald-100 bg-gradient-to-br from-emerald-100 via-emerald-50 to-lime-100 text-emerald-700",
      edge: "rgba(167, 243, 208, 0.92)",
      halo: "rgba(4, 120, 87, 0.46)",
      glow: "radial-gradient(circle, rgba(209,250,229,0.92) 0%, rgba(167,243,208,0.72) 34%, rgba(4,120,87,0.2) 58%, rgba(255,255,255,0) 78%)",
      flameOuter: "#059669",
      flameInner: "#34d399",
      flameCore: "#d1fae5",
      flameStroke: "#047857",
    };
  }

  if (tone === "indigo") {
    return {
      key: "indigo",
      shell: "from-indigo-100 via-white to-blue-100",
      avatarClass:
        "border-indigo-100 bg-gradient-to-br from-indigo-100 via-indigo-50 to-blue-100 text-indigo-700",
      edge: "rgba(199, 210, 254, 0.94)",
      halo: "rgba(67, 56, 202, 0.44)",
      glow: "radial-gradient(circle, rgba(224,231,255,0.95) 0%, rgba(199,210,254,0.76) 34%, rgba(67,56,202,0.24) 58%, rgba(255,255,255,0) 78%)",
      flameOuter: "#4338ca",
      flameInner: "#818cf8",
      flameCore: "#e0e7ff",
      flameStroke: "#312e81",
    };
  }

  if (tone === "rose") {
    return {
      key: "rose",
      shell: "from-rose-100 via-amber-50 to-pink-100",
      avatarClass:
        "border-rose-100 bg-gradient-to-br from-rose-100 via-amber-50 to-pink-100 text-rose-700",
      edge: "rgba(254, 205, 211, 0.94)",
      halo: "rgba(190, 24, 93, 0.44)",
      glow: "radial-gradient(circle, rgba(255,247,214,0.96) 0%, rgba(254,205,211,0.78) 34%, rgba(190,24,93,0.22) 58%, rgba(255,255,255,0) 78%)",
      flameOuter: "#e11d48",
      flameInner: "#fb7185",
      flameCore: "#fff7d6",
      flameStroke: "#be123c",
    };
  }

  if (tone === "violet") {
    return {
      key: "violet",
      shell: "from-violet-100 via-white to-fuchsia-100",
      avatarClass:
        "border-violet-100 bg-gradient-to-br from-violet-100 via-violet-50 to-fuchsia-100 text-violet-700",
      edge: "rgba(221, 214, 254, 0.92)",
      halo: "rgba(109, 40, 217, 0.46)",
      glow: "radial-gradient(circle, rgba(237,233,254,0.94) 0%, rgba(221,214,254,0.74) 34%, rgba(109,40,217,0.22) 58%, rgba(255,255,255,0) 78%)",
      flameOuter: "#7c3aed",
      flameInner: "#a78bfa",
      flameCore: "#ede9fe",
      flameStroke: "#6d28d9",
    };
  }

  if (tone === "sky") {
    return {
      key: "sky",
      shell: "from-sky-100 via-white to-cyan-100",
      avatarClass:
        "border-sky-100 bg-gradient-to-br from-sky-100 via-sky-50 to-cyan-100 text-sky-700",
      edge: "rgba(186, 230, 253, 0.94)",
      halo: "rgba(3, 105, 161, 0.46)",
      glow: "radial-gradient(circle, rgba(224,242,254,0.94) 0%, rgba(186,230,253,0.74) 34%, rgba(3,105,161,0.22) 58%, rgba(255,255,255,0) 78%)",
      flameOuter: "#0284c7",
      flameInner: "#38bdf8",
      flameCore: "#e0f2fe",
      flameStroke: "#0369a1",
    };
  }

  return {
    key: "amber",
    shell: "from-amber-100 via-white to-orange-100",
    avatarClass:
      "border-amber-100 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 text-amber-700",
    edge: "rgba(253, 230, 138, 0.94)",
    halo: "rgba(180, 83, 9, 0.46)",
    glow: "radial-gradient(circle, rgba(254,243,199,0.94) 0%, rgba(253,230,138,0.76) 34%, rgba(180,83,9,0.2) 58%, rgba(255,255,255,0) 78%)",
    flameOuter: "#b45309",
    flameInner: "#f59e0b",
    flameCore: "#fef3c7",
    flameStroke: "#78350f",
  };
}

function formatStreakDays(value) {
  return `${value} day${value === 1 ? "" : "s"}`;
}

function formatLeaderboardPercentage(value) {
  const numericValue = Number(value);
  return `${(Number.isFinite(numericValue) ? numericValue : 0).toFixed(1)}%`;
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

  if (tierTone === "violet") {
    return tierIsLive
      ? "border border-violet-200 bg-violet-100 text-violet-700 shadow-sm"
      : "border border-violet-100 bg-violet-50/90 text-violet-700";
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
  const confirmedMarkedDays = Number(
    student?.confirmedMarkedDays || presentDays + Number(student?.absentDays || 0),
  );
  const confirmedOverallPercentage = Number(
    student?.confirmedOverallPercentage || 0,
  );
  const attendanceScore = Number(student?.attendanceScore || 0);

  if (confirmedMarkedDays > 0) {
    return `Score ${formatLeaderboardScore(
      attendanceScore,
    )} • ${formatLeaderboardPercentage(
      confirmedOverallPercentage,
    )} confirmed attendance • ${presentDays}/${confirmedMarkedDays} present`;
  }

  return `Score ${formatLeaderboardScore(
    attendanceScore,
  )} • ${formatLeaderboardPercentage(
    confirmedOverallPercentage,
  )} confirmed attendance`;
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

function StudentAssistant({
  assistant,
  todayStatus,
  overallAttendance,
  monthSummary,
  onClose,
}) {
  return (
    <>
      <div className="absolute bottom-2 right-6 hidden xl:block">
        <div className="assistant-arrive pointer-events-none flex items-end gap-4">
          <div
            className={`pointer-events-auto relative mb-8 w-[210px] rounded-[22px] border px-3.5 py-3 shadow-[0_18px_42px_-22px_rgba(15,23,42,0.28)] backdrop-blur ${getAssistantClasses(
              assistant.tone,
            )}`}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gray-500 transition hover:bg-white hover:text-gray-700"
              aria-label="Close assistant"
            >
              <span className="text-base leading-none">x</span>
            </button>
            <p className="pr-7 text-xs font-semibold text-gray-900">
              {assistant.title}
            </p>
            <p className="mt-1.5 text-[11px] leading-5 text-gray-700">
              {assistant.message}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white/85 px-2 py-1 text-[9px] font-semibold text-gray-700 shadow-sm">
                Overall {overallAttendance}%
              </span>
              <span className="rounded-full bg-white/85 px-2 py-1 text-[9px] font-semibold text-gray-700 shadow-sm">
                Month {monthSummary.percentage}%
              </span>
            </div>
            <div className="absolute bottom-4 right-[-8px] h-3.5 w-3.5 rotate-45 rounded-[3px] border-r border-b border-white/70 bg-white/85" />
          </div>

          <div className="assistant-body relative h-[136px] w-[112px]">
            <svg
              viewBox="0 0 112 136"
              className="assistant-figure h-full w-full drop-shadow-[0_18px_30px_rgba(37,99,235,0.22)]"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="buddyHead"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient
                  id="buddyBody"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>

              <ellipse
                cx="57"
                cy="129"
                rx="22"
                ry="5"
                fill="rgba(15,23,42,0.14)"
              />

              <rect
                x="43"
                y="58"
                width="28"
                height="36"
                rx="12"
                fill="url(#buddyBody)"
              />
              <rect
                x="36"
                y="62"
                width="7"
                height="30"
                rx="4"
                fill="#3b82f6"
                transform="rotate(26 36 62)"
              />
              <rect
                x="72"
                y="64"
                width="7"
                height="26"
                rx="4"
                fill="#2563eb"
                transform="rotate(-28 72 64)"
              />

              <circle cx="56" cy="39" r="26" fill="url(#buddyHead)" />
              <ellipse cx="53" cy="39" rx="20" ry="21" fill="#f8fbff" />
              <path
                d="M44 21c4-5 11-8 19-6 4 1 8 3 11 7-7-2-14 1-20 5-4 2-8 3-10 3 0-4 0-6 0-9Z"
                fill="#2563eb"
              />
              <ellipse cx="48" cy="39" rx="4.2" ry="4.8" fill="#0f172a" />
              <path
                d="M40 47c4-1 8-1 12 0"
                fill="none"
                stroke="#334155"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M44 54c3 3 8 3 11 0"
                fill="none"
                stroke="#334155"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <ellipse
                cx="63"
                cy="37"
                rx="6"
                ry="12"
                fill="#dbeafe"
                opacity="0.75"
              />
            </svg>
            <div className="assistant-leg assistant-leg-left">
              <div className="assistant-thigh">
                <div className="assistant-shin">
                  <div className="assistant-foot" />
                </div>
              </div>
            </div>
            <div className="assistant-leg assistant-leg-right">
              <div className="assistant-thigh">
                <div className="assistant-shin">
                  <div className="assistant-foot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`mt-4 overflow-hidden rounded-2xl border p-3 shadow-sm md:hidden ${getAssistantClasses(
          assistant.tone,
        )}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                Student Buddy
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {assistant.title}
            </p>
            <p className="mt-1.5 text-[11px] leading-5 text-gray-700">
              {assistant.message}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white/85 px-2 py-1 text-[9px] font-semibold text-gray-700 shadow-sm">
                Overall {overallAttendance}%
              </span>
              <span className="rounded-full bg-white/85 px-2 py-1 text-[9px] font-semibold text-gray-700 shadow-sm">
                Month {monthSummary.percentage}%
              </span>
              <span className="rounded-full bg-white/85 px-2 py-1 text-[9px] font-semibold text-gray-700 shadow-sm">
                {todayStatus === "present"
                  ? "Today Present"
                  : todayStatus === "absent"
                    ? "Today Absent"
                    : "Today Not Marked"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-gray-500"
              aria-label="Close assistant"
            >
              <span className="text-base leading-none">x</span>
            </button>

            <div className="relative h-[82px] w-[88px] overflow-hidden rounded-xl bg-white/35">
              <div className="mobile-assistant-arrive absolute bottom-0 right-0">
                <div className="mobile-assistant-body relative h-[76px] w-[62px]">
                  <svg
                    viewBox="0 0 112 136"
                    className="mobile-assistant-figure h-[76px] w-[62px] drop-shadow-[0_14px_22px_rgba(37,99,235,0.18)]"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id="buddyHeadMobile"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#7dd3fc" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                      <linearGradient
                        id="buddyBodyMobile"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                    </defs>

                    <ellipse
                      cx="57"
                      cy="129"
                      rx="22"
                      ry="5"
                      fill="rgba(15,23,42,0.14)"
                    />
                    <rect
                      x="43"
                      y="58"
                      width="28"
                      height="36"
                      rx="12"
                      fill="url(#buddyBodyMobile)"
                    />
                    <rect
                      x="36"
                      y="62"
                      width="7"
                      height="30"
                      rx="4"
                      fill="#3b82f6"
                      transform="rotate(26 36 62)"
                    />
                    <rect
                      x="72"
                      y="64"
                      width="7"
                      height="26"
                      rx="4"
                      fill="#2563eb"
                      transform="rotate(-28 72 64)"
                    />
                    <circle
                      cx="56"
                      cy="39"
                      r="26"
                      fill="url(#buddyHeadMobile)"
                    />
                    <ellipse cx="53" cy="39" rx="20" ry="21" fill="#f8fbff" />
                    <path
                      d="M44 21c4-5 11-8 19-6 4 1 8 3 11 7-7-2-14 1-20 5-4 2-8 3-10 3 0-4 0-6 0-9Z"
                      fill="#2563eb"
                    />
                    <ellipse cx="48" cy="39" rx="4.2" ry="4.8" fill="#0f172a" />
                    <path
                      d="M40 47c4-1 8-1 12 0"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M44 54c3 3 8 3 11 0"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <ellipse
                      cx="63"
                      cy="37"
                      rx="6"
                      ry="12"
                      fill="#dbeafe"
                      opacity="0.75"
                    />
                  </svg>
                  <div className="mobile-assistant-leg mobile-assistant-leg-left">
                    <div className="mobile-assistant-thigh">
                      <div className="mobile-assistant-shin">
                        <div className="mobile-assistant-foot" />
                      </div>
                    </div>
                  </div>
                  <div className="mobile-assistant-leg mobile-assistant-leg-right">
                    <div className="mobile-assistant-thigh">
                      <div className="mobile-assistant-shin">
                        <div className="mobile-assistant-foot" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .assistant-arrive {
          will-change: transform;
          animation: buddy-arrive 2.4s cubic-bezier(0.22, 0.61, 0.36, 1)
            forwards;
        }

        .assistant-figure {
          position: relative;
          z-index: 2;
        }

        .assistant-leg {
          position: absolute;
          bottom: 8px;
          width: 16px;
          height: 46px;
          z-index: 1;
        }

        .assistant-leg-left {
          left: 45px;
          color: #475569;
        }

        .assistant-leg-right {
          left: 58px;
          color: #0f172a;
        }

        .mobile-assistant-arrive {
          will-change: transform;
          animation: mobile-buddy-arrive 2.4s cubic-bezier(0.22, 0.61, 0.36, 1)
            forwards;
        }

        .mobile-assistant-body {
          position: relative;
        }

        .mobile-assistant-figure {
          position: relative;
          z-index: 2;
        }

        .mobile-assistant-leg {
          position: absolute;
          bottom: 5px;
          width: 10px;
          height: 28px;
          z-index: 1;
        }

        .mobile-assistant-leg-left {
          left: 27px;
          color: #475569;
        }

        .mobile-assistant-leg-right {
          left: 35px;
          color: #0f172a;
        }

        .mobile-assistant-thigh {
          position: absolute;
          top: 0;
          left: 2px;
          width: 5px;
          height: 12px;
          border-radius: 999px;
          background: currentColor;
          transform-origin: top center;
        }

        .mobile-assistant-shin {
          position: absolute;
          top: 10px;
          left: 0;
          width: 5px;
          height: 11px;
          border-radius: 999px;
          background: currentColor;
          transform-origin: top center;
        }

        .mobile-assistant-foot {
          position: absolute;
          bottom: -1px;
          left: -2px;
          width: 9px;
          height: 3px;
          border-radius: 999px;
          background: currentColor;
        }

        .mobile-assistant-leg-left .mobile-assistant-thigh {
          animation: mobile-left-thigh 2.4s linear forwards;
        }

        .mobile-assistant-leg-right .mobile-assistant-thigh {
          animation: mobile-right-thigh 2.4s linear forwards;
        }

        .mobile-assistant-leg-left .mobile-assistant-shin {
          animation: mobile-left-knee 2.4s linear forwards;
        }

        .mobile-assistant-leg-right .mobile-assistant-shin {
          animation: mobile-right-knee 2.4s linear forwards;
        }

        .assistant-thigh {
          position: absolute;
          top: 0;
          left: 4px;
          width: 8px;
          height: 20px;
          border-radius: 999px;
          background: currentColor;
          transform-origin: top center;
        }

        .assistant-shin {
          position: absolute;
          top: 16px;
          left: 0;
          width: 8px;
          height: 18px;
          border-radius: 999px;
          background: currentColor;
          transform-origin: top center;
        }

        .assistant-foot {
          position: absolute;
          bottom: -1px;
          left: -2px;
          width: 13px;
          height: 4px;
          border-radius: 999px;
          background: currentColor;
        }

        .assistant-leg-left .assistant-thigh {
          animation: left-thigh 2.4s linear forwards;
        }

        .assistant-leg-right .assistant-thigh {
          animation: right-thigh 2.4s linear forwards;
        }

        .assistant-leg-left .assistant-shin {
          animation: left-knee 2.4s linear forwards;
        }

        .assistant-leg-right .assistant-shin {
          animation: right-knee 2.4s linear forwards;
        }

        @keyframes buddy-arrive {
          0% {
            transform: translate3d(140px, 0, 0);
          }
          15% {
            transform: translate3d(88px, 0, 0);
          }
          30% {
            transform: translate3d(36px, 0, 0);
          }
          45% {
            transform: translate3d(-18px, 0, 0);
          }
          60% {
            transform: translate3d(-72px, 0, 0);
          }
          75% {
            transform: translate3d(-124px, 0, 0);
          }
          90% {
            transform: translate3d(-154px, 0, 0);
          }
          100% {
            transform: translate3d(-160px, 0, 0);
          }
        }

        @keyframes mobile-buddy-arrive {
          0% {
            transform: translate3d(58px, 0, 0);
          }
          15% {
            transform: translate3d(37px, 0, 0);
          }
          30% {
            transform: translate3d(15px, 0, 0);
          }
          45% {
            transform: translate3d(-6px, 0, 0);
          }
          60% {
            transform: translate3d(-20px, 0, 0);
          }
          75% {
            transform: translate3d(-30px, 0, 0);
          }
          90% {
            transform: translate3d(-36px, 0, 0);
          }
          100% {
            transform: translate3d(-38px, 0, 0);
          }
        }

        @keyframes left-thigh {
          0% {
            transform: rotate(14deg);
          }
          12% {
            transform: rotate(-12deg);
          }
          24% {
            transform: rotate(14deg);
          }
          36% {
            transform: rotate(-12deg);
          }
          48% {
            transform: rotate(14deg);
          }
          60% {
            transform: rotate(-12deg);
          }
          72% {
            transform: rotate(12deg);
          }
          84% {
            transform: rotate(-8deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes right-thigh {
          0% {
            transform: rotate(-12deg);
          }
          12% {
            transform: rotate(14deg);
          }
          24% {
            transform: rotate(-12deg);
          }
          36% {
            transform: rotate(14deg);
          }
          48% {
            transform: rotate(-12deg);
          }
          60% {
            transform: rotate(14deg);
          }
          72% {
            transform: rotate(-10deg);
          }
          84% {
            transform: rotate(8deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes left-knee {
          0% {
            transform: rotate(-6deg);
          }
          12% {
            transform: rotate(-22deg);
          }
          24% {
            transform: rotate(-8deg);
          }
          36% {
            transform: rotate(-20deg);
          }
          48% {
            transform: rotate(-8deg);
          }
          60% {
            transform: rotate(-18deg);
          }
          72% {
            transform: rotate(-10deg);
          }
          84% {
            transform: rotate(-6deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes right-knee {
          0% {
            transform: rotate(-18deg);
          }
          12% {
            transform: rotate(-6deg);
          }
          24% {
            transform: rotate(-18deg);
          }
          36% {
            transform: rotate(-6deg);
          }
          48% {
            transform: rotate(-18deg);
          }
          60% {
            transform: rotate(-6deg);
          }
          72% {
            transform: rotate(-12deg);
          }
          84% {
            transform: rotate(-6deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes mobile-left-thigh {
          0% {
            transform: rotate(14deg);
          }
          12% {
            transform: rotate(-10deg);
          }
          24% {
            transform: rotate(14deg);
          }
          36% {
            transform: rotate(-10deg);
          }
          48% {
            transform: rotate(14deg);
          }
          60% {
            transform: rotate(-10deg);
          }
          72% {
            transform: rotate(8deg);
          }
          84% {
            transform: rotate(-6deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes mobile-right-thigh {
          0% {
            transform: rotate(-10deg);
          }
          12% {
            transform: rotate(12deg);
          }
          24% {
            transform: rotate(-10deg);
          }
          36% {
            transform: rotate(12deg);
          }
          48% {
            transform: rotate(-10deg);
          }
          60% {
            transform: rotate(12deg);
          }
          72% {
            transform: rotate(-8deg);
          }
          84% {
            transform: rotate(6deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes mobile-left-knee {
          0% {
            transform: rotate(-6deg);
          }
          12% {
            transform: rotate(-18deg);
          }
          24% {
            transform: rotate(-8deg);
          }
          36% {
            transform: rotate(-16deg);
          }
          48% {
            transform: rotate(-8deg);
          }
          60% {
            transform: rotate(-16deg);
          }
          72% {
            transform: rotate(-9deg);
          }
          84% {
            transform: rotate(-6deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes mobile-right-knee {
          0% {
            transform: rotate(-16deg);
          }
          12% {
            transform: rotate(-6deg);
          }
          24% {
            transform: rotate(-16deg);
          }
          36% {
            transform: rotate(-6deg);
          }
          48% {
            transform: rotate(-16deg);
          }
          60% {
            transform: rotate(-6deg);
          }
          72% {
            transform: rotate(-10deg);
          }
          84% {
            transform: rotate(-6deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
      `}</style>
    </>
  );
}

export default function StudentDashboard() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [assistantVisible, setAssistantVisible] = useState(true);

  const [todayStatus, setTodayStatus] = useState("not_marked"); // present/absent/not_marked
  const [monthSummary, setMonthSummary] = useState({
    from: "",
    to: "",
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  });
  const [overallAttendance, setOverallAttendance] = useState(0);
  const [streaks, setStreaks] = useState({
    current: 0,
    best: 0,
  });
  const [streakProgress, setStreakProgress] = useState({
    current: 0,
    previousTarget: 0,
    target: 3,
    nextTarget: 3,
    percent: 0,
    message: "Start attending regularly this month to build your streak.",
    resetsOnAbsent: true,
  });
  const [attendanceBadges, setAttendanceBadges] = useState([]);
  const [streakMonthLabel, setStreakMonthLabel] = useState("");
  const [leaderboard, setLeaderboard] = useState({
    totalStudents: 0,
    yourRank: null,
    yourTitle: "Rising",
    yourConfirmedOverallPercentage: 0,
    yourConfirmedMarkedDays: 0,
    yourPresentDays: 0,
    gapToNextRank: 0,
    motivation: "",
  });

  const today = useMemo(() => toISODate(new Date()), []);
  const monthRange = useMemo(() => getMonthRange(new Date()), []);

  useEffect(() => {
    try {
      const savedVisibility = window.localStorage.getItem(
        "student-buddy-visible",
      );
      const hasSeenMobileIntro =
        window.localStorage.getItem("student-buddy-mobile-seen") === "true";
      const isMobileViewport = window.innerWidth < 768;

      if (isMobileViewport && !hasSeenMobileIntro) {
        setAssistantVisible(true);
        window.localStorage.setItem("student-buddy-mobile-seen", "true");
        return;
      }

      if (savedVisibility === "hidden") {
        setAssistantVisible(false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr("");

      try {
        // 1) logged-in user
        const meRes = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const meData = await meRes.json().catch(() => ({}));
        if (!meRes.ok) throw new Error(meData.message || "Unauthorized");

        if (String(meData?.user?.role || "").toLowerCase() !== "student") {
          throw new Error("Not a student account");
        }

        setMe(meData.user);

        // 2) today attendance (student API)
        const tRes = await fetch(`/api/student/attendance?date=${today}`, {
          credentials: "include",
          cache: "no-store",
        });
        const tData = await tRes.json().catch(() => ({}));
        if (tRes.ok) setTodayStatus(tData.status || "not_marked");

        // 3) month attendance list (student API)
        const { from, to } = monthRange;
        const mRes = await fetch(
          `/api/student/attendance?from=${from}&to=${to}`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );
        const mData = await mRes.json().catch(() => ({}));

        const list = Array.isArray(mData?.list) ? mData.list : [];
        const present = list.filter((x) => x.status === "present").length;
        const absent = list.filter((x) => x.status === "absent").length;
        const total = present + absent;
        const percentage =
          total === 0 ? 0 : Number(((present / total) * 100).toFixed(1));

        setMonthSummary({ from, to, total, present, absent, percentage });

        const summaryRes = await fetch("/api/student/attendance?view=summary", {
          credentials: "include",
          cache: "no-store",
        });
        const summaryData = await summaryRes.json().catch(() => ({}));
        if (summaryRes.ok) {
          setOverallAttendance(
            Number(
              summaryData?.overall?.confirmedPercentage ??
                summaryData?.overall?.percentage ??
                0,
            ),
          );
          setStreaks({
            current: Number(summaryData?.streaks?.current || 0),
            best: Number(summaryData?.streaks?.best || 0),
          });
          setStreakProgress({
            current: Number(summaryData?.streakProgress?.current || 0),
            previousTarget: Number(
              summaryData?.streakProgress?.previousTarget || 0,
            ),
            target: Number(summaryData?.streakProgress?.target || 3),
            nextTarget: summaryData?.streakProgress?.nextTarget ?? 3,
            percent: Number(summaryData?.streakProgress?.percent || 0),
            message:
              summaryData?.streakProgress?.message ||
              "Start attending regularly this month to build your streak.",
            resetsOnAbsent:
              summaryData?.streakProgress?.resetsOnAbsent !== false,
          });
          setAttendanceBadges(
            Array.isArray(summaryData?.badges) ? summaryData.badges : [],
          );
          setStreakMonthLabel(String(summaryData?.streakMonthLabel || ""));
          setLeaderboard({
            totalStudents: Number(
              summaryData?.attendanceLeaderboard?.totalStudents || 0,
            ),
            yourRank: summaryData?.attendanceLeaderboard?.yourRank ?? null,
            yourTitle:
              String(summaryData?.attendanceLeaderboard?.yourTitle || "").trim() ||
              "Rising",
            yourConfirmedOverallPercentage: Number(
              summaryData?.attendanceLeaderboard?.yourConfirmedOverallPercentage ||
                0,
            ),
            yourConfirmedMarkedDays: Number(
              summaryData?.attendanceLeaderboard?.yourConfirmedMarkedDays || 0,
            ),
            yourPresentDays: Number(
              summaryData?.attendanceLeaderboard?.yourPresentDays || 0,
            ),
            gapToNextRank: Number(
              summaryData?.attendanceLeaderboard?.gapToNextRank || 0,
            ),
            motivation: String(summaryData?.attendanceLeaderboard?.motivation || ""),
          });
        }
      } catch (e) {
        setErr(e.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [today, monthRange]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "student-buddy-visible",
        assistantVisible ? "visible" : "hidden",
      );
    } catch {}
  }, [assistantVisible]);

  const course = String(me?.course || "").toUpperCase();
  const assistantReady = !loading && !err && !!me;
  const assistant = buildAssistantMessage({
    me,
    todayStatus,
    monthSummary,
    overallPercentage: overallAttendance,
  });

  const todayBadge =
    todayStatus === "present"
      ? "bg-green-100 text-green-700"
      : todayStatus === "absent"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-700";

  const todayStatusLabel =
    todayStatus === "present"
      ? "Present"
      : todayStatus === "absent"
        ? "Absent"
        : "Not Marked";
  const earnedBadgeCount = attendanceBadges.filter(
    (badge) => badge.unlocked,
  ).length;
  const nextBadge = attendanceBadges.find((badge) => !badge.unlocked);
  const streakNote = getStreakNote(streaks.current);
  const profileThemeTone = getProfileThemeTone(streaks.current);
  const showProfileFire = !loading && !err;
  const streakPeriodLabel = streakMonthLabel || "this month";
  const normalizedStreakPercent = Math.max(
    0,
    Math.min(100, streakProgress.percent),
  );
  const profileStreakTheme = showProfileFire
    ? getProfileStreakTheme(profileThemeTone)
    : null;

  const snapshotCards = [
    {
      title: "This Month",
      value: `${monthSummary.percentage}%`,
      note: `${monthSummary.present} present / ${monthSummary.total} marked`,
      icon: CalendarDays,
      iconWrap: "bg-sky-100 text-sky-700",
      valueClass: "text-slate-950",
    },
    {
      title: "Overall",
      value: `${overallAttendance}%`,
      note: "Counted from January 2026 to today",
      icon: TrendingUp,
      iconWrap: "bg-emerald-100 text-emerald-700",
      valueClass: "text-emerald-700",
    },
    {
      title: "Today",
      value: todayStatusLabel,
      note: today,
      icon:
        todayStatus === "present"
          ? CheckCircle2
          : todayStatus === "absent"
            ? AlertCircle
            : Clock3,
      iconWrap:
        todayStatus === "present"
          ? "bg-green-100 text-green-700"
          : todayStatus === "absent"
            ? "bg-red-100 text-red-700"
            : "bg-slate-100 text-slate-700",
      valueClass:
        todayStatus === "present"
          ? "text-green-700"
          : todayStatus === "absent"
            ? "text-red-700"
            : "text-slate-700",
    },
    {
      title: "Monthly Spread",
      value: `${monthSummary.present}/${monthSummary.absent}`,
      note: "Present / Absent classes this month",
      icon: Activity,
      iconWrap: "bg-violet-100 text-violet-700",
      valueClass: "text-violet-700",
    },
  ];
  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eef2ff_22%,#f8fafc_56%,#f8fafc_100%)]">
        <div className="relative overflow-visible border-b border-white/60 bg-[radial-gradient(circle_at_top_left,#eff6ff_0%,#ffffff_42%,#eef2ff_100%)] px-4 py-6 md:min-h-[240px] md:px-6 md:pb-8 md:pr-28 lg:pr-[22rem] xl:pr-[30rem]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_48%)]" />
          <div className="pointer-events-none absolute left-10 top-8 h-20 w-20 rounded-full bg-blue-200/30 blur-2xl" />
          <div className="pointer-events-none absolute left-44 top-14 h-14 w-14 rounded-full bg-cyan-200/30 blur-2xl" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-blue-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Student Dashboard
            </div>

            <div className="mt-5 flex flex-col items-center gap-4 rounded-[28px] border border-white/80 bg-white/80 p-4 text-center shadow-[0_22px_45px_-30px_rgba(15,23,42,0.28)] backdrop-blur sm:p-5 md:flex-row md:items-center md:text-left">
              <FlameAvatar
                src={me?.profileImage}
                name={me?.name}
                theme={profileStreakTheme}
                size={208}
              />

              <div className="w-full min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Student Profile
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  Welcome back, {me?.name || "Student"}
                </h1>

                {loading ? (
                  <p className="mt-2 text-sm text-gray-600">
                    Loading your dashboard...
                  </p>
                ) : err ? (
                  <p className="mt-2 text-sm text-red-600">{err}</p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      {course || "Course not set"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                      <Clock3 className="h-4 w-4 text-violet-600" />
                      {me?.year ? `Year ${me.year}` : "Year not set"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border border-white/80 px-4 py-2 text-xs font-semibold shadow-sm ${todayBadge}`}
                    >
                      <Activity className="h-4 w-4" />
                      Today {todayStatusLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {assistantReady &&
            (assistantVisible ? (
              <StudentAssistant
                assistant={assistant}
                todayStatus={todayStatus}
                overallAttendance={overallAttendance}
                monthSummary={monthSummary}
                onClose={() => setAssistantVisible(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAssistantVisible(true)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-[0_18px_35px_-22px_rgba(37,99,235,0.9)] transition hover:-translate-y-0.5 hover:bg-blue-50 md:absolute md:right-4 md:top-4 md:mt-0 md:w-auto"
                aria-label="Show student buddy"
              >
                <Sparkles className="h-4 w-4" />
                Show buddy
              </button>
            ))}
        </div>

        <div className="space-y-6 p-4 md:p-6 md:pb-8">
          <div className="overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92),rgba(224,231,255,0.88))] p-5 shadow-[0_30px_80px_-44px_rgba(15,23,42,0.45)] backdrop-blur md:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Attendance First
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-950 md:text-[2rem]">
                  Attendance Snapshot
                </h2>
                <p className="mt-3 text-sm leading-7 text-gray-600 md:text-base">
                  A cleaner academic overview with your live attendance, current
                  day status, current-month streak progress, and monthly tier
                  badges all in one premium card.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/dashboard/student/attendance"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
                >
                  Open Attendance
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/student/points"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 sm:w-auto"
                >
                  Open Student Points
                  <Trophy className="h-4 w-4" />
                </Link>
                <div className="w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm shadow-sm sm:w-auto">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Focus
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    Build your live attendance category while academic categories roll out
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {snapshotCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[26px] border border-white/80 bg-white/88 p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.38)] backdrop-blur md:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {card.title}
                      </p>
                      <p
                        className={`mt-3 text-3xl font-bold ${card.valueClass}`}
                      >
                        {card.value}
                      </p>
                    </div>
                    <span
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconWrap}`}
                    >
                      <card.icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    {card.note}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.35fr]">
              <div className="rounded-[28px] border border-orange-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,247,237,0.96),rgba(254,242,242,0.95))] p-5 shadow-[0_20px_44px_-34px_rgba(249,115,22,0.5)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
                      Streak Meter
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-slate-950">
                      Show up. Stack this month. Unlock more.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Live streak colors and badges are tied to{" "}
                      {streakPeriodLabel}.
                    </p>
                  </div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                    <Flame className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      This Month
                    </p>
                    <p className="mt-3 text-4xl font-bold text-orange-600">
                      {streaks.current}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      present working days in a row
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Best This Month
                    </p>
                    <p className="mt-3 text-4xl font-bold text-violet-700">
                      {streaks.best}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      highest run in {streakPeriodLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                    <div className="absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 rounded-full bg-white/90" />
                    <div
                      className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 transition-all duration-500"
                      style={{
                        width: `${normalizedStreakPercent}%`,
                      }}
                    >
                      {normalizedStreakPercent > 0 && (
                        <span className="pointer-events-none absolute right-[-18px] top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center">
                          <span className="absolute inset-[8px] rounded-full bg-orange-300/75 blur-lg animate-pulse" />
                          <Flame className="relative h-10 w-10 animate-pulse fill-orange-500 text-orange-500 drop-shadow-[0_10px_22px_rgba(15,23,42,0.18)]" />
                          <span className="hidden">streak flame</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {streakNote}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-orange-800">
                    {streakProgress.message}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Holidays, Sundays, internships, and approved off-days are
                    skipped, so they never reduce your streak. A working-day
                    absence resets the live streak bar for {streakPeriodLabel}.
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.95),rgba(243,232,255,0.92))] p-5 shadow-[0_24px_50px_-38px_rgba(37,99,235,0.45)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                      Monthly Streak Badges
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-slate-950">
                      Your tier ladder
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Badges stay earned from your best streak in{" "}
                      {streakPeriodLabel}, while your current active tier stays
                      highlighted.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Unlocked
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">
                      {earnedBadgeCount}
                      <span className="ml-1 text-sm font-medium text-gray-500">
                        / {attendanceBadges.length || 6}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {attendanceBadges.map((badge) => {
                    const styles = getBadgeStyles(
                      badge.tone,
                      badge.unlocked,
                      badge.isCurrentTier,
                    );
                    const BadgeIcon = getBadgeIcon(badge.icon);

                    return (
                      <div
                        key={badge.key}
                        className={`rounded-[24px] border p-4 shadow-sm transition ${styles.card}`}
                      >
                        <div className={styles.glow} />
                        <div className={styles.veil} />
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={`relative inline-flex h-10 w-10 items-center justify-center rounded-2xl ${styles.icon}`}
                          >
                            <BadgeIcon className="h-4 w-4" />
                          </span>
                          <span
                            className={`relative rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${styles.chip}`}
                          >
                            {getBadgeStatusLabel(badge)}
                          </span>
                        </div>

                        <p className={`relative mt-4 text-base font-semibold ${styles.title}`}>
                          {badge.title}
                        </p>
                        <p className={`relative mt-1 text-xs leading-5 ${styles.body}`}>
                          {badge.description}
                        </p>
                        <p className={`relative mt-3 text-[11px] font-semibold ${styles.meta}`}>
                          {formatBadgeProgress(badge)}
                        </p>
                        <p className={`relative mt-1 text-[11px] leading-5 ${styles.note}`}>
                          {getBadgeStatusNote(badge)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {nextBadge ? (
                  <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm shadow-sm">
                    <p className="font-semibold text-gray-900">
                      Next badge: {nextBadge.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {nextBadge.description} Progress:{" "}
                      {formatBadgeProgress(nextBadge)}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm shadow-sm">
                    <p className="font-semibold text-emerald-800">
                      Every monthly streak badge is unlocked right now.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                      Keep protecting {streakPeriodLabel} and hold that premium
                      momentum.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,251,235,0.94),rgba(239,246,255,0.9))] p-5 shadow-[0_30px_80px_-44px_rgba(15,23,42,0.42)] backdrop-blur md:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Student Points Preview
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-950 md:text-[2rem]">
                  Track the live ranking on your student points page
                </h2>
                <p className="mt-3 text-sm leading-7 text-gray-600 md:text-base">
                  The student points page now explains the full 100-point
                  structure. Your current live ranking there still runs on the
                  attendance category until assignments, class tests, and
                  results begin storing portal data.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard/student/points"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
                >
                  Open Student Points Page
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="rounded-2xl border border-white/80 bg-white/82 px-4 py-3 text-sm shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Live Attendance Snapshot
                  </p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {formatLeaderboardPercentage(
                      leaderboard.yourConfirmedOverallPercentage,
                    )}
                    {" • "}
                    {leaderboard.yourRank ? `Rank #${leaderboard.yourRank}` : "Rank pending"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Live Attendance Coverage
                </p>
                <p className="mt-3 text-3xl font-bold text-blue-700">
                  {formatLeaderboardPercentage(
                    leaderboard.yourConfirmedOverallPercentage,
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {leaderboard.yourPresentDays}/{leaderboard.yourConfirmedMarkedDays} marked present
                </p>
              </div>

              <div className="rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Current Live Rank
                </p>
                <p className="mt-3 text-3xl font-bold text-amber-700">
                  {leaderboard.yourRank ? `#${leaderboard.yourRank}` : "-"}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {leaderboard.totalStudents} students in the live attendance ranking
                </p>
              </div>

              <div className="rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Momentum
                </p>
                <p className="mt-3 text-lg font-bold text-slate-950">
                  {leaderboard.motivation ||
                    "Open the student points page to see the 100-point structure and your live attendance ranking."}
                </p>
                {leaderboard.gapToNextRank > 0 ? (
                  <p className="mt-2 text-xs text-gray-500">
                    {formatLeaderboardPercentage(leaderboard.gapToNextRank)} to
                    the next rank.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ComingSoonCard
              title="Results Module"
              description="Marks, semester result summaries, and performance insights are being polished for your dashboard and reserved result points."
              icon={TrendingUp}
              accent="blue"
            />
            <ComingSoonCard
              title="Fees Module"
              description="A smoother fees experience is on the way with payment history, dues, and reminders in one place."
              icon={Receipt}
              accent="amber"
            />
            <ComingSoonCard
              title="Assignments Module"
              description="Upcoming assignment tracking and submission progress are being prepared for this section and reserved assignment points."
              icon={FileClock}
              accent="emerald"
            />
          </div>
        </div>
      </div>
    </>
  );
}
