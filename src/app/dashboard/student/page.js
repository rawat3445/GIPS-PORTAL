"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileClock,
  Receipt,
  Sparkles,
  TrendingUp,
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

function buildAssistantMessage({ me, todayStatus, monthSummary, overallPercentage }) {
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

function StudentAssistant({
  assistant,
  todayStatus,
  overallAttendance,
  monthSummary,
  onClose,
}) {
  return (
    <>
      <div className="absolute bottom-2 right-6 hidden md:block">
        <div className="assistant-arrive pointer-events-none flex items-end gap-4">
          <div
            className={`pointer-events-auto relative mb-8 w-[210px] rounded-[22px] border px-3.5 py-3 shadow-[0_18px_42px_-22px_rgba(15,23,42,0.28)] backdrop-blur ${getAssistantClasses(
              assistant.tone
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
                <linearGradient id="buddyHead" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="buddyBody" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>

              <ellipse cx="57" cy="129" rx="22" ry="5" fill="rgba(15,23,42,0.14)" />

              <rect x="43" y="58" width="28" height="36" rx="12" fill="url(#buddyBody)" />
              <rect x="36" y="62" width="7" height="30" rx="4" fill="#3b82f6" transform="rotate(26 36 62)" />
              <rect x="72" y="64" width="7" height="26" rx="4" fill="#2563eb" transform="rotate(-28 72 64)" />

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
              <ellipse cx="63" cy="37" rx="6" ry="12" fill="#dbeafe" opacity="0.75" />
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
          assistant.tone
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
            <p className="text-sm font-semibold text-gray-900">{assistant.title}</p>
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
                      <linearGradient id="buddyHeadMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7dd3fc" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                      <linearGradient id="buddyBodyMobile" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                    </defs>

                    <ellipse cx="57" cy="129" rx="22" ry="5" fill="rgba(15,23,42,0.14)" />
                    <rect x="43" y="58" width="28" height="36" rx="12" fill="url(#buddyBodyMobile)" />
                    <rect x="36" y="62" width="7" height="30" rx="4" fill="#3b82f6" transform="rotate(26 36 62)" />
                    <rect x="72" y="64" width="7" height="26" rx="4" fill="#2563eb" transform="rotate(-28 72 64)" />
                    <circle cx="56" cy="39" r="26" fill="url(#buddyHeadMobile)" />
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
                    <ellipse cx="63" cy="37" rx="6" ry="12" fill="#dbeafe" opacity="0.75" />
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
          animation: buddy-arrive 2.4s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
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

  const today = useMemo(() => toISODate(new Date()), []);
  const monthRange = useMemo(() => getMonthRange(new Date()), []);

  useEffect(() => {
    try {
      const savedVisibility = window.localStorage.getItem(
        "student-buddy-visible"
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
          }
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
          setOverallAttendance(Number(summaryData?.overall?.percentage || 0));
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
        assistantVisible ? "visible" : "hidden"
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eef2ff_22%,#f8fafc_56%,#f8fafc_100%)]">
      <div className="relative overflow-visible border-b border-white/60 bg-[radial-gradient(circle_at_top_left,#eff6ff_0%,#ffffff_42%,#eef2ff_100%)] px-4 py-6 md:min-h-[240px] md:px-6 md:pb-8 md:pr-[30rem]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_48%)]" />
        <div className="pointer-events-none absolute left-10 top-8 h-20 w-20 rounded-full bg-blue-200/30 blur-2xl" />
        <div className="pointer-events-none absolute left-44 top-14 h-14 w-14 rounded-full bg-cyan-200/30 blur-2xl" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-blue-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Student Dashboard
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            Welcome back, {me?.name || "Student"}
          </h1>

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Course {course || "-"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
              <Clock3 className="h-4 w-4 text-violet-600" />
              {me?.year ? `Year ${me.year}` : "Year not set"}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border border-white/80 px-4 py-2 text-xs font-semibold shadow-sm ${todayBadge}`}>
              <Activity className="h-4 w-4" />
              Today {todayStatusLabel}
            </span>
          </div>

        {loading ? (
          <p className="mt-3 text-sm text-gray-600">Loading your dashboard...</p>
        ) : err ? (
          <p className="mt-3 text-sm text-red-600">{err}</p>
        ) : (
          <p className="hidden text-sm text-gray-600 mt-1">
            Welcome back, {me?.name || "Student"} • Course: {course || "-"}
          </p>
        )}
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
              className="absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-[0_18px_35px_-22px_rgba(37,99,235,0.9)] transition hover:-translate-y-0.5 hover:bg-blue-50"
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
                day status, and monthly spread all in one premium card.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/student/attendance"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Open Attendance
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Focus
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  Keep attendance above 75%
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
                    <p className={`mt-3 text-3xl font-bold ${card.valueClass}`}>
                      {card.value}
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconWrap}`}
                  >
                    <card.icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-500">{card.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ComingSoonCard
            title="Results Module"
            description="Marks, semester result summaries, and performance insights are being polished for your dashboard."
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
            description="Upcoming assignment tracking and submission progress are being prepared for this section."
            icon={FileClock}
            accent="emerald"
          />
        </div>
      </div>

    </div>
  );
}
