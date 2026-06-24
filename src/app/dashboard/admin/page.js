"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bug,
  BookOpen,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  UserRoundCheck,
  Users,
  UsersRound,
} from "lucide-react";

const COURSE_LABELS = {
  BPT: "Bachelor of Physiotherapy",
  BOPTOM: "Bachelor of Optometry",
  BMRIT: "Medical Radiology & Imaging",
  DOPTOM: "Diploma in Optometry",
  BOTT: "Operation Theater Technology",
};

const emptyStats = {
  totalStudents: 0,
  totalFaculty: 0,
  studentsByCourse: [],
  studentsByYear: [],
  facultyByCourse: [],
  newlyRegisteredStudents: 0,
  newlyRegisteredStudentList: [],
  highestAttendanceStudents: 0,
  highestAttendanceStudentList: [],
  topAttendanceDebugList: [],
  lowAttendanceStudents: 0,
  lowAttendanceStudentList: [],
  inactiveStudents: 0,
  inactiveStudentList: [],
  inactiveStudentsNote: "",
};

function getAccentStyles(accent) {
  if (accent === "emerald") {
    return {
      shell:
        "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94),rgba(209,250,229,0.72))]",
      softPanel: "border-emerald-100 bg-white/92",
      badge: "bg-emerald-100 text-emerald-700",
      iconWrap: "bg-emerald-100 text-emerald-700",
      chip: "border-emerald-100 bg-emerald-50 text-emerald-700",
      button: "text-emerald-700",
      value: "text-emerald-700",
      dot: "bg-emerald-500",
      divider: "from-transparent via-emerald-200 to-transparent",
      beam: "from-emerald-200/45 via-transparent to-transparent",
    };
  }

  if (accent === "amber") {
    return {
      shell:
        "border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,247,237,0.94),rgba(254,243,199,0.78))]",
      softPanel: "border-amber-100 bg-white/92",
      badge: "bg-amber-100 text-amber-700",
      iconWrap: "bg-amber-100 text-amber-700",
      chip: "border-amber-100 bg-amber-50 text-amber-700",
      button: "text-amber-700",
      value: "text-amber-700",
      dot: "bg-amber-500",
      divider: "from-transparent via-amber-200 to-transparent",
      beam: "from-amber-200/50 via-transparent to-transparent",
    };
  }

  if (accent === "red") {
    return {
      shell:
        "border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,241,242,0.94),rgba(254,226,226,0.78))]",
      softPanel: "border-rose-100 bg-white/92",
      badge: "bg-rose-100 text-rose-700",
      iconWrap: "bg-rose-100 text-rose-700",
      chip: "border-rose-100 bg-rose-50 text-rose-700",
      button: "text-rose-700",
      value: "text-rose-700",
      dot: "bg-rose-500",
      divider: "from-transparent via-rose-200 to-transparent",
      beam: "from-rose-200/50 via-transparent to-transparent",
    };
  }

  if (accent === "violet") {
    return {
      shell:
        "border-violet-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,243,255,0.94),rgba(233,213,255,0.74))]",
      softPanel: "border-violet-100 bg-white/92",
      badge: "bg-violet-100 text-violet-700",
      iconWrap: "bg-violet-100 text-violet-700",
      chip: "border-violet-100 bg-violet-50 text-violet-700",
      button: "text-violet-700",
      value: "text-violet-700",
      dot: "bg-violet-500",
      divider: "from-transparent via-violet-200 to-transparent",
      beam: "from-violet-200/45 via-transparent to-transparent",
    };
  }

  if (accent === "slate") {
    return {
      shell:
        "border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95),rgba(226,232,240,0.8))]",
      softPanel: "border-slate-200 bg-white/92",
      badge: "bg-slate-100 text-slate-700",
      iconWrap: "bg-slate-100 text-slate-700",
      chip: "border-slate-200 bg-slate-50 text-slate-700",
      button: "text-slate-700",
      value: "text-slate-800",
      dot: "bg-slate-500",
      divider: "from-transparent via-slate-200 to-transparent",
      beam: "from-slate-200/45 via-transparent to-transparent",
    };
  }

  return {
    shell:
      "border-blue-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.94),rgba(219,234,254,0.78))]",
    softPanel: "border-blue-100 bg-white/92",
    badge: "bg-blue-100 text-blue-700",
    iconWrap: "bg-blue-100 text-blue-700",
    chip: "border-blue-100 bg-blue-50 text-blue-700",
    button: "text-blue-700",
    value: "text-blue-700",
    dot: "bg-blue-500",
    divider: "from-transparent via-blue-200 to-transparent",
    beam: "from-blue-200/45 via-transparent to-transparent",
  };
}

function getCourseName(course) {
  return COURSE_LABELS[course] || course || "Unassigned";
}

function getInitials(name) {
  return String(name || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatValue(value) {
  return typeof value === "number" ? value.toLocaleString() : value;
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[22px] border border-dashed border-gray-200 bg-white/78 px-4 py-5 text-sm leading-6 text-gray-500">
      {text}
    </div>
  );
}

function SectionEyebrow({ label, icon: Icon, accent = "blue" }) {
  const styles = getAccentStyles(accent);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${styles.badge}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function MetricCard({ label, value, note, hint, icon: Icon, accent = "blue" }) {
  const styles = getAccentStyles(accent);

  return (
    <div
      className={`relative overflow-hidden rounded-[30px] border p-5 shadow-[0_28px_65px_-42px_rgba(15,23,42,0.38)] backdrop-blur ${styles.shell}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${styles.beam}`}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <SectionEyebrow label={label} icon={Icon} accent={accent} />
            <p className={`mt-4 text-4xl font-bold tracking-tight ${styles.value}`}>
              {formatValue(value)}
            </p>
          </div>
          <span
            className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${styles.iconWrap}`}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-gray-600">{note}</p>

        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
          {hint}
        </div>
      </div>
    </div>
  );
}

function SignalCard({ title, value, detail, icon: Icon, accent = "blue" }) {
  const styles = getAccentStyles(accent);

  return (
    <div
      className={`rounded-[22px] border p-4 shadow-sm backdrop-blur ${styles.softPanel}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            {title}
          </p>
          <p className={`mt-3 text-2xl font-bold ${styles.value}`}>{value}</p>
        </div>
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${styles.iconWrap}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-gray-500">{detail}</p>
    </div>
  );
}

function AdminGuideCard({ loading, stats }) {
  const signals = [
    {
      title: "Admissions",
      value: loading ? "..." : stats.newlyRegisteredStudents,
      detail: "Fresh student additions in the last 30 days",
      icon: UserPlus,
      accent: "amber",
    },
    {
      title: "Attendance Leaders",
      value: loading ? "..." : stats.highestAttendanceStudents,
      detail: "Students currently maintaining 75% or above",
      icon: TrendingUp,
      accent: "emerald",
    },
    {
      title: "Action Required",
      value: loading ? "..." : stats.lowAttendanceStudents,
      detail: "Students at 50% or below who need follow-up",
      icon: AlertTriangle,
      accent: "red",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,247,237,0.9),rgba(239,246,255,0.82))] p-5 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_34%)]" />
      <div className="relative">
        <SectionEyebrow label="Admin Guide" icon={Sparkles} accent="amber" />
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Everything important is now easier to scan.
        </h2>
        <p className="mt-3 text-sm leading-7 text-gray-600">
          Student growth, faculty allocation, and attendance risk are grouped
          into cleaner panels so you can move from overview to action without
          digging through plain tables.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-1">
          {signals.map((signal) => (
            <SignalCard key={signal.title} {...signal} />
          ))}
        </div>

        <div className="mt-4 rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Focus next
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50/70 px-3 py-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
              <p className="text-sm leading-6 text-gray-600">
                Review fresh registrations and connect them to the right course
                flow quickly.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 px-3 py-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm leading-6 text-gray-600">
                Watch the attendance leaders and use them as a benchmark for
                student engagement.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-rose-50/70 px-3 py-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
              <p className="text-sm leading-6 text-gray-600">
                Low-attendance and inactive student lists are separated below so
                you can act faster.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  subtitle,
  accent = "blue",
  icon: Icon,
  isOpen,
  onToggle,
  count,
  children,
}) {
  const styles = getAccentStyles(accent);

  return (
    <div
      className={`relative overflow-hidden rounded-[30px] border p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.36)] backdrop-blur ${styles.shell}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${styles.divider}`}
      />
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-4 text-left"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${styles.iconWrap}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-gray-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
            >
              {count}
            </span>
            <span className={styles.button}>
              {isOpen ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </span>
          </div>
        </button>

        {isOpen && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
}

function CompactPersonCard({ name, secondary, accent = "blue" }) {
  const styles = getAccentStyles(accent);

  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-white/80 bg-white/90 px-3 py-3 shadow-sm">
      <span
        className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-xs font-bold ${styles.iconWrap}`}
      >
        {getInitials(name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950">{name}</p>
        <p className="truncate text-xs text-gray-500">{secondary}</p>
      </div>
    </div>
  );
}

function StudentWatchCard({
  title,
  subtitle,
  students,
  emptyText,
  accent = "blue",
  count,
  isOpen,
  onToggle,
}) {
  const styles = getAccentStyles(accent);

  return (
    <div
      className={`relative overflow-hidden rounded-[30px] border p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.38)] backdrop-blur ${styles.shell}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${styles.divider}`}
      />
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-4 text-left"
        >
          <div className="min-w-0">
            <SectionEyebrow label="Student Watch" icon={Users} accent={accent} />
            <h3 className="mt-3 text-xl font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">{subtitle}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
            >
              {count}
            </span>
            <span className={styles.button}>
              {isOpen ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </span>
          </div>
        </button>

        {isOpen && (
          <div className="mt-5">
            {students.length === 0 ? (
              <EmptyState text={emptyText} />
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div
                    key={student._id}
                    className="rounded-[26px] border border-white/80 bg-white/92 p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <span
                          className={`inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] text-sm font-bold ${styles.iconWrap}`}
                        >
                          {getInitials(student.name)}
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold text-slate-950">
                              {student.name}
                            </p>
                            {"attendancePercentage" in student && (
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles.badge}`}
                              >
                                {student.attendancePercentage}%
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-sm text-gray-500">
                            {student.email}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles.chip}`}
                            >
                              {student.course || "-"}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles.chip}`}
                            >
                              Year {student.year || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:w-[190px] xl:justify-end">
                        {"attendancePercentage" in student ? (
                          <>
                            <div
                              className={`rounded-[20px] border px-4 py-3 text-center ${styles.softPanel}`}
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                                Attendance
                              </p>
                              <p className={`mt-2 text-2xl font-bold ${styles.value}`}>
                                {student.attendancePercentage}%
                              </p>
                            </div>
                            <div
                              className={`rounded-[20px] border px-4 py-3 text-center ${styles.softPanel}`}
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                                Status
                              </p>
                              <p className="mt-2 text-sm font-semibold text-slate-950">
                                Watch Live
                              </p>
                            </div>
                          </>
                        ) : (
                          <div
                            className={`rounded-[20px] border px-4 py-3 text-center ${styles.softPanel}`}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Profile
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-950">
                              Ready to review
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSections, setOpenSections] = useState({
    course: false,
    year: false,
    faculty: false,
    topAttendanceDebug: false,
    newStudents: false,
    highAttendance: false,
    lowAttendance: false,
    inactive: false,
  });

  function toggleSection(section) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/admin/stats", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load dashboard stats");
        }

        setStats({
          totalStudents: data.totalStudents || 0,
          totalFaculty: data.totalFaculty || 0,
          studentsByCourse: Array.isArray(data.studentsByCourse)
            ? data.studentsByCourse
            : [],
          studentsByYear: Array.isArray(data.studentsByYear)
            ? data.studentsByYear
            : [],
          facultyByCourse: Array.isArray(data.facultyByCourse)
            ? data.facultyByCourse
            : [],
          newlyRegisteredStudents: data.newlyRegisteredStudents || 0,
          newlyRegisteredStudentList: Array.isArray(
            data.newlyRegisteredStudentList
          )
            ? data.newlyRegisteredStudentList
            : [],
          highestAttendanceStudents: data.highestAttendanceStudents || 0,
          highestAttendanceStudentList: Array.isArray(
            data.highestAttendanceStudentList
          )
            ? data.highestAttendanceStudentList
            : [],
          topAttendanceDebugList: Array.isArray(data.topAttendanceDebugList)
            ? data.topAttendanceDebugList
            : [],
          lowAttendanceStudents: data.lowAttendanceStudents || 0,
          lowAttendanceStudentList: Array.isArray(data.lowAttendanceStudentList)
            ? data.lowAttendanceStudentList
            : [],
          inactiveStudents: data.inactiveStudents || 0,
          inactiveStudentList: Array.isArray(data.inactiveStudentList)
            ? data.inactiveStudentList
            : [],
          inactiveStudentsNote: data.inactiveStudentsNote || "",
        });
      } catch (err) {
        setError(err.message || "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const metricCards = [
    {
      label: "Total Students",
      value: loading ? "..." : stats.totalStudents,
      note: "Registered student accounts now visible from the live portal data.",
      hint: "Live student records connected",
      icon: Users,
      accent: "amber",
    },
    {
      label: "Total Faculty",
      value: loading ? "..." : stats.totalFaculty,
      note: "Faculty members currently assigned across active programs.",
      hint: "Teaching coverage synced",
      icon: UsersRound,
      accent: "blue",
    },
    {
      label: "New Registrations",
      value: loading ? "..." : stats.newlyRegisteredStudents,
      note: "Fresh student accounts created in the last 30 days.",
      hint: "Admissions lane updated",
      icon: UserPlus,
      accent: "emerald",
    },
    {
      label: "Attendance Leaders",
      value: loading ? "..." : stats.highestAttendanceStudents,
      note: "Students currently above the 75% attendance benchmark.",
      hint: "Top engagement watchlist",
      icon: TrendingUp,
      accent: "emerald",
    },
    {
      label: "Low Attendance",
      value: loading ? "..." : stats.lowAttendanceStudents,
      note: "Students at 50% or below who need closer admin follow-up.",
      hint: "Risk signal active",
      icon: AlertTriangle,
      accent: "amber",
    },
    {
      label: "Inactive Students",
      value: loading ? "..." : stats.inactiveStudents,
      note:
        stats.inactiveStudentsNote ||
        "Students with no recent attendance activity.",
      hint: "Needs intervention",
      icon: Activity,
      accent: "red",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fff7ed_22%,#f8fafc_58%,#f8fafc_100%)]">
      <div className="border-b border-white/70 bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_46%,#eef6ff_100%)] px-4 py-6 md:px-6">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Dashboard
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              College command center
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
              Admissions, attendance, course balance, and faculty mapping are
              now grouped into stronger visual blocks so the page feels like a
              real control room instead of an old report screen.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/92 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                <Users className="h-4 w-4 text-amber-600" />
                Student records live
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/92 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Attendance intelligence active
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/92 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                <GraduationCap className="h-4 w-4 text-violet-600" />
                Course view updated
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/92 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                <UserRoundCheck className="h-4 w-4 text-blue-600" />
                Faculty mapping live
              </span>
            </div>
          </div>

          <AdminGuideCard loading={loading} stats={stats} />
        </div>
      </div>

      <div className="space-y-8 p-4 md:p-6 md:pb-8">
        {error && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <div>
          <SectionEyebrow label="Live Overview" icon={Sparkles} accent="amber" />
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                People and performance at a glance
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-600">
                These cards surface the strongest signals first so admin can
                move quickly from overview to the detailed panels below.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metricCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>

        <div>
          <SectionEyebrow label="Academic Tools" icon={Target} accent="amber" />
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Quick access to publishing workflows
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                Open the academic modules you update most often without hunting
                through the sidebar.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/dashboard/admin/class-tests"
            className="rounded-[28px] border border-amber-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,247,237,0.95),rgba(254,243,199,0.82))] p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.3)] transition hover:-translate-y-1"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Target className="h-5 w-5" />
            </span>
            <p className="mt-4 text-lg font-semibold text-slate-950">
              Manage Class Tests
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Publish batch-wise class tests with course, year, subject,
              pass-fail status, total marks, and student numbers.
            </p>
          </Link>

          <Link
            href="/dashboard/admin/results"
            className="rounded-[28px] border border-violet-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,243,255,0.95),rgba(233,213,255,0.78))] p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.3)] transition hover:-translate-y-1"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <BookOpen className="h-5 w-5" />
            </span>
            <p className="mt-4 text-lg font-semibold text-slate-950">
              Manage Results
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Open the full result workflow for subject-wise marks, practicals,
              print view, and result-point selection.
            </p>
          </Link>

          <Link
            href="/dashboard/admin/course-catalog"
            className="rounded-[28px] border border-blue-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.95),rgba(219,234,254,0.8))] p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.3)] transition hover:-translate-y-1"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <GraduationCap className="h-5 w-5" />
            </span>
            <p className="mt-4 text-lg font-semibold text-slate-950">
              Course Catalog
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Update subjects, materials, notices, and faculty information for
              each course and year.
            </p>
          </Link>
        </div>

        <div>
          <SectionEyebrow
            label="Academic Structure"
            icon={GraduationCap}
            accent="violet"
          />
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Course, year, and faculty breakdowns
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                Open these panels to inspect where students are grouped, which
                faculty are mapped to each program, and how the academic spread
                looks right now.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <InsightCard
            title="Students by Course"
            subtitle="A richer course view with roster preview and mapped faculty on the same card."
            count={stats.studentsByCourse.length}
            accent="emerald"
            icon={GraduationCap}
            isOpen={openSections.course}
            onToggle={() => toggleSection("course")}
          >
            {loading ? (
              <p className="text-sm text-gray-500">Loading course data...</p>
            ) : stats.studentsByCourse.length === 0 ? (
              <EmptyState text="No course data found." />
            ) : (
              <div className="space-y-4">
                {stats.studentsByCourse.map((item) => (
                  <div
                    key={item.course}
                    className="rounded-[26px] border border-white/80 bg-white/92 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-semibold text-slate-950">
                          {item.course}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {getCourseName(item.course)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          {item.count} students
                        </span>
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          {item.faculty?.length || 0} faculty
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/65 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Student roster preview
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {item.students?.slice(0, 4).map((student) => (
                            <CompactPersonCard
                              key={student._id}
                              name={student.name}
                              secondary={`Year ${student.year || "-"} | ${
                                student.email || "Student"
                              }`}
                              accent="emerald"
                            />
                          ))}
                        </div>
                        {!item.students?.length && (
                          <p className="mt-3 text-sm text-gray-500">
                            No students found for this course.
                          </p>
                        )}
                        {item.students?.length > 4 && (
                          <p className="mt-3 text-xs font-medium text-emerald-700">
                            +{item.students.length - 4} more students in this course
                          </p>
                        )}
                      </div>

                      <div className="rounded-[24px] border border-blue-100 bg-blue-50/65 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                          Faculty mapped here
                        </p>
                        <div className="mt-3 grid gap-3">
                          {item.faculty?.length > 0 ? (
                            item.faculty.map((faculty) => (
                              <CompactPersonCard
                                key={faculty._id}
                                name={faculty.name}
                                secondary={faculty.email || "Faculty member"}
                                accent="blue"
                              />
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">
                              No faculty assigned to this course yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InsightCard>

          <InsightCard
            title="Students by Year"
            subtitle="Cleaner year cards so academic spread feels easier to understand."
            count={stats.studentsByYear.length}
            accent="violet"
            icon={Users}
            isOpen={openSections.year}
            onToggle={() => toggleSection("year")}
          >
            {loading ? (
              <p className="text-sm text-gray-500">Loading year data...</p>
            ) : stats.studentsByYear.length === 0 ? (
              <EmptyState text="No year data found." />
            ) : (
              <div className="space-y-4">
                {stats.studentsByYear.map((item) => (
                  <div
                    key={item.year}
                    className="rounded-[26px] border border-white/80 bg-white/92 p-5 shadow-sm"
                  >
                    <div className="grid gap-4 lg:grid-cols-[0.34fr_0.66fr]">
                      <div className="rounded-[24px] border border-violet-100 bg-violet-50/75 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                          Academic band
                        </p>
                        <p className="mt-4 text-5xl font-bold tracking-tight text-violet-700">
                          {item.year}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {item.count} student{item.count === 1 ? "" : "s"} are
                          currently grouped in this year.
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-white/80 bg-white/88 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Student preview
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {item.students?.slice(0, 4).map((student) => (
                            <CompactPersonCard
                              key={student._id}
                              name={student.name}
                              secondary={`${student.course || "-"} | ${
                                student.email || "Student"
                              }`}
                              accent="violet"
                            />
                          ))}
                        </div>
                        {!item.students?.length && (
                          <p className="mt-3 text-sm text-gray-500">
                            No students found for this year.
                          </p>
                        )}
                        {item.students?.length > 4 && (
                          <p className="mt-3 text-xs font-medium text-violet-700">
                            +{item.students.length - 4} more students in Year{" "}
                            {item.year}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InsightCard>

          <InsightCard
            title="Faculty by Course"
            subtitle="Teaching allocation now looks more like a real staffing board."
            count={stats.facultyByCourse.length}
            accent="blue"
            icon={UsersRound}
            isOpen={openSections.faculty}
            onToggle={() => toggleSection("faculty")}
          >
            {loading ? (
              <p className="text-sm text-gray-500">Loading faculty data...</p>
            ) : stats.facultyByCourse.length === 0 ? (
              <EmptyState text="No faculty data found." />
            ) : (
              <div className="space-y-4">
                {stats.facultyByCourse.map((item) => (
                  <div
                    key={item.course}
                    className="rounded-[26px] border border-white/80 bg-white/92 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-semibold text-slate-950">
                          {item.course}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {getCourseName(item.course)}
                        </p>
                      </div>
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                        {item.count} faculty member{item.count === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {item.faculty?.length > 0 ? (
                        item.faculty.map((faculty) => (
                          <div
                            key={faculty._id}
                            className="rounded-[22px] border border-blue-100 bg-blue-50/72 p-4"
                          >
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-sm font-bold text-blue-700">
                                {getInitials(faculty.name)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950">
                                  {faculty.name}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                  {faculty.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No faculty assigned to this course yet.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InsightCard>

          <InsightCard
            title="Top Attendance Debug"
            subtitle="Exact attendance inputs behind the leader calculation so you can verify the numbers."
            count={stats.topAttendanceDebugList.length}
            accent="slate"
            icon={Bug}
            isOpen={openSections.topAttendanceDebug}
            onToggle={() => toggleSection("topAttendanceDebug")}
          >
            {stats.topAttendanceDebugList.length === 0 ? (
              <EmptyState text="No attendance debug data found." />
            ) : (
              <div className="space-y-3">
                {stats.topAttendanceDebugList.map((student) => (
                  <div
                    key={student._id}
                    className="rounded-[26px] border border-white/80 bg-white/92 p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <span className="inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] bg-slate-100 text-sm font-bold text-slate-700">
                          {getInitials(student.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-950">
                            {student.name}
                          </p>
                          <p className="mt-1 truncate text-sm text-gray-500">
                            {student.email}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                              {student.course || "-"}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                              Year {student.year || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                            Present
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {student.presentDays}
                          </p>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                            Marked
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {student.markedDays}
                          </p>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                            Working
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {student.workingDays}
                          </p>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                            Attendance
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {student.attendancePercentage}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InsightCard>
        </div>

        <div>
          <SectionEyebrow label="Student Watchlists" icon={Users} accent="blue" />
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Track the students who need attention or deserve recognition
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                These lists are kept separate so admin can quickly spot new
                arrivals, attendance leaders, students at risk, and inactive
                accounts without digging through one crowded panel.
              </p>
            </div>
          </div>
        </div>

        {!loading && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <StudentWatchCard
              title="Newly Registered Students"
              subtitle="Fresh student entries added recently, ready for onboarding or follow-up."
              students={stats.newlyRegisteredStudentList}
              emptyText="No newly registered students found."
              accent="emerald"
              count={stats.newlyRegisteredStudents}
              isOpen={openSections.newStudents}
              onToggle={() => toggleSection("newStudents")}
            />

            <StudentWatchCard
              title="Highest Attendance Students"
              subtitle="Students currently at 75% or above attendance from January 2026 to today."
              students={stats.highestAttendanceStudentList}
              emptyText="No attendance leaders found yet."
              accent="blue"
              count={stats.highestAttendanceStudents}
              isOpen={openSections.highAttendance}
              onToggle={() => toggleSection("highAttendance")}
            />

            <StudentWatchCard
              title="Low Attendance Students"
              subtitle="Students currently at 50% or below attendance and needing attention."
              students={stats.lowAttendanceStudentList}
              emptyText="No low attendance students found."
              accent="amber"
              count={stats.lowAttendanceStudents}
              isOpen={openSections.lowAttendance}
              onToggle={() => toggleSection("lowAttendance")}
            />

            <StudentWatchCard
              title="Inactive Students"
              subtitle="Students with no recent attendance activity, useful for follow-up and validation."
              students={stats.inactiveStudentList}
              emptyText="No inactive students found."
              accent="red"
              count={stats.inactiveStudents}
              isOpen={openSections.inactive}
              onToggle={() => toggleSection("inactive")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
