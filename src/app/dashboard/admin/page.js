"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Ban,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  GraduationCap,
  MessageSquareText,
  ShieldCheck,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
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
  generatedAt: "",
  todayISO: "",
  totalStudents: 0,
  totalFaculty: 0,
  totalTeachingFaculty: 0,
  totalNonTeachingFaculty: 0,
  overallAttendanceRate: 0,
  todayAttendance: {
    date: "",
    markedStudents: 0,
    presentCount: 0,
    absentCount: 0,
    unmarkedStudents: 0,
    attendanceRate: 0,
    approvedCourseEntries: 0,
    pendingCourseEntries: 0,
  },
  courseHighlights: [],
  blockedStudentsCount: 0,
  blockedStudentList: [],
  highestAttendanceStudents: 0,
  highestAttendanceStudentList: [],
  lowestAttendanceStudents: 0,
  lowestAttendanceStudentList: [],
  lowAttendanceStudents: 0,
  lowAttendanceStudentList: [],
  inactiveStudents: 0,
  inactiveStudentList: [],
  newlyRegisteredStudents: 0,
  newlyRegisteredStudentList: [],
};

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

function formatDateTime(value) {
  if (!value) return "Live";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Live";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateOnly(value) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function SectionBadge({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700 shadow-sm">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function MetricCard({ title, value, note, icon: Icon, tone = "amber" }) {
  const tones = {
    amber: {
      shell:
        "border-amber-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,247,237,0.95),rgba(254,243,199,0.78))]",
      icon: "bg-amber-100 text-amber-700",
      value: "text-amber-700",
    },
    blue: {
      shell:
        "border-blue-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.95),rgba(219,234,254,0.8))]",
      icon: "bg-blue-100 text-blue-700",
      value: "text-blue-700",
    },
    emerald: {
      shell:
        "border-emerald-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,253,245,0.95),rgba(209,250,229,0.78))]",
      icon: "bg-emerald-100 text-emerald-700",
      value: "text-emerald-700",
    },
    rose: {
      shell:
        "border-rose-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,241,242,0.95),rgba(254,226,226,0.78))]",
      icon: "bg-rose-100 text-rose-700",
      value: "text-rose-700",
    },
  };

  const style = tones[tone] || tones.amber;

  return (
    <div className={`rounded-[28px] border p-5 shadow-[0_28px_60px_-42px_rgba(15,23,42,0.34)] ${style.shell}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            {title}
          </p>
          <p className={`mt-4 text-4xl font-bold tracking-tight ${style.value}`}>
            {value}
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-600">{note}</p>
        </div>
        <span className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${style.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[22px] border border-dashed border-gray-200 bg-white/80 px-4 py-5 text-sm text-gray-500">
      {text}
    </div>
  );
}

function ExpandableSection({ title, subtitle, count, icon: Icon, open, onToggle, children }) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95),rgba(241,245,249,0.9))] p-5 shadow-[0_28px_65px_-42px_rgba(15,23,42,0.3)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {count}
          </span>
          {open ? (
            <ChevronUp className="h-5 w-5 text-slate-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-600" />
          )}
        </div>
      </button>
      {open && <div className="mt-5">{children}</div>}
    </div>
  );
}

function StudentRow({ student, variant = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    high: "bg-emerald-100 text-emerald-700 border-emerald-200",
    low: "bg-amber-100 text-amber-700 border-amber-200",
    blocked: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <div className="rounded-[24px] border border-white/80 bg-white/92 p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className={`inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] border text-sm font-bold ${tones[variant] || tones.neutral}`}>
            {getInitials(student.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/admin/students?studentId=${encodeURIComponent(
                  student._id,
                )}&course=${encodeURIComponent(student.course || "")}&year=${encodeURIComponent(
                  String(student.year || ""),
                )}`}
                className="truncate text-base font-semibold text-slate-950 hover:text-blue-700 hover:underline"
              >
                {student.name}
              </Link>
              {"attendancePercentage" in student && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {student.attendancePercentage}%
                </span>
              )}
              {student.accessStatus && (
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold uppercase text-rose-700">
                  {student.accessStatus}
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-gray-500">{student.email}</p>
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

        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[260px]">
          {"attendancePercentage" in student && (
            <>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Attendance
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {student.attendancePercentage}%
                </p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Present Days
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {student.presentDays}
                </p>
              </div>
            </>
          )}
          {student.accessStatus && (
            <>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Last Active
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {student.daysSinceLastActivity === null
                    ? "No activity"
                    : `${student.daysSinceLastActivity} days ago`}
                </p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Window End
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {student.accessWindowEndDate
                    ? formatDateOnly(student.accessWindowEndDate)
                    : "Manual block"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CourseCard({ item }) {
  const todayCoverage = item.totalStudents
    ? Math.min(100, Number(((item.todayMarkedStudents / item.totalStudents) * 100).toFixed(1)))
    : 0;

  return (
    <div className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_22px_55px_-42px_rgba(15,23,42,0.3)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xl font-semibold text-slate-950">{item.course}</p>
          <p className="mt-1 text-sm text-gray-500">{getCourseName(item.course)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {item.totalStudents} students
          </span>
          <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
            {item.blockedStudents} blocked
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Today
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-bold tracking-tight text-emerald-700">
                {item.todayAttendanceRate}%
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {item.todayPresentCount} present, {item.todayAbsentCount} absent
              </p>
            </div>
            <div className="rounded-2xl bg-white/85 px-4 py-3 text-right shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Marked
              </p>
              <p className="mt-1 text-xl font-bold text-slate-950">
                {item.todayMarkedStudents}/{item.totalStudents}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${todayCoverage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-emerald-700">
            Coverage for today: {todayCoverage}%
          </p>
        </div>

        <div className="rounded-[22px] border border-blue-100 bg-blue-50/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            Overall
          </p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-blue-700">
            {item.overallAttendanceRate}%
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Genuine overall student attendance for this course from live portal records.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700">
              {item.facultyCount} faculty mapped
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/admin/attendance?course=${encodeURIComponent(item.course)}`}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          Open Attendance
        </Link>
        <Link
          href={`/dashboard/admin/students?course=${encodeURIComponent(item.course)}`}
          className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          Open Student List
        </Link>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Student preview
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {item.studentsPreview?.length > 0 ? (
            item.studentsPreview.map((student) => (
                <Link
                  key={student._id}
                  href={`/dashboard/admin/students?studentId=${encodeURIComponent(
                    student._id,
                  )}&course=${encodeURIComponent(student.course || item.course || "")}&year=${encodeURIComponent(
                    String(student.year || ""),
                  )}`}
                  className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-blue-200 hover:bg-blue-50/60"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xs font-bold text-slate-700 shadow-sm">
                    {getInitials(student.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {student.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">{student.email}</p>
                  </div>
                </Link>
              ))
          ) : (
            <p className="text-sm text-gray-500">No students found for this course.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [reviewSummary, setReviewSummary] = useState({
    totalReviews: 0,
    averageOverallRating: 0,
    reviews: [],
    facultySummary: [],
  });
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sections, setSections] = useState({
    blocked: true,
    highest: false,
    lowest: false,
    atRisk: false,
    inactive: false,
    recent: false,
  });

  function toggleSection(key) {
    setSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

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
        throw new Error(data.message || "Failed to load dashboard");
      }

      setStats({
        generatedAt: data.generatedAt || "",
        todayISO: data.todayISO || "",
        totalStudents: data.totalStudents || 0,
        totalFaculty: data.totalFaculty || 0,
        totalTeachingFaculty: data.totalTeachingFaculty || 0,
        totalNonTeachingFaculty: data.totalNonTeachingFaculty || 0,
        overallAttendanceRate: data.overallAttendanceRate || 0,
        todayAttendance: {
          date: data.todayAttendance?.date || "",
          markedStudents: data.todayAttendance?.markedStudents || 0,
          presentCount: data.todayAttendance?.presentCount || 0,
          absentCount: data.todayAttendance?.absentCount || 0,
          unmarkedStudents: data.todayAttendance?.unmarkedStudents || 0,
          attendanceRate: data.todayAttendance?.attendanceRate || 0,
          approvedCourseEntries: data.todayAttendance?.approvedCourseEntries || 0,
          pendingCourseEntries: data.todayAttendance?.pendingCourseEntries || 0,
        },
        courseHighlights: Array.isArray(data.courseHighlights)
          ? data.courseHighlights
          : [],
        blockedStudentsCount: data.blockedStudentsCount || 0,
        blockedStudentList: Array.isArray(data.blockedStudentList)
          ? data.blockedStudentList
          : [],
        highestAttendanceStudents: data.highestAttendanceStudents || 0,
        highestAttendanceStudentList: Array.isArray(data.highestAttendanceStudentList)
          ? data.highestAttendanceStudentList
          : [],
        lowestAttendanceStudents: data.lowestAttendanceStudents || 0,
        lowestAttendanceStudentList: Array.isArray(data.lowestAttendanceStudentList)
          ? data.lowestAttendanceStudentList
          : [],
        lowAttendanceStudents: data.lowAttendanceStudents || 0,
        lowAttendanceStudentList: Array.isArray(data.lowAttendanceStudentList)
          ? data.lowAttendanceStudentList
          : [],
        inactiveStudents: data.inactiveStudents || 0,
        inactiveStudentList: Array.isArray(data.inactiveStudentList)
          ? data.inactiveStudentList
          : [],
        newlyRegisteredStudents: data.newlyRegisteredStudents || 0,
        newlyRegisteredStudentList: Array.isArray(data.newlyRegisteredStudentList)
          ? data.newlyRegisteredStudentList
          : [],
      });
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviewSummary() {
    try {
      setReviewLoading(true);
      setReviewError("");

      const res = await fetch("/api/admin/faculty-reviews?limit=5", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load faculty reviews");
      }

      setReviewSummary({
        totalReviews: Number(data?.totalReviews || 0),
        averageOverallRating: Number(data?.averageOverallRating || 0),
        reviews: Array.isArray(data?.reviews) ? data.reviews : [],
        facultySummary: Array.isArray(data?.facultySummary)
          ? data.facultySummary
          : [],
      });
    } catch (err) {
      setReviewError(err.message || "Failed to load faculty reviews");
      setReviewSummary({
        totalReviews: 0,
        averageOverallRating: 0,
        reviews: [],
        facultySummary: [],
      });
    } finally {
      setReviewLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
    fetchReviewSummary();
  }, []);

  const metricCards = [
    {
      title: "Today Attendance",
      value: loading ? "..." : `${stats.todayAttendance.attendanceRate}%`,
      note: "Overall student attendance for today from approved live records.",
      icon: CalendarDays,
      tone: "emerald",
    },
    {
      title: "Marked Today",
      value: loading
        ? "..."
        : `${stats.todayAttendance.markedStudents}/${stats.totalStudents}`,
      note: "Students whose attendance is already marked today.",
      icon: Users,
      tone: "blue",
    },
    {
      title: "Overall Attendance",
      value: loading ? "..." : `${stats.overallAttendanceRate}%`,
      note: "Combined attendance performance across the full portal timeline.",
      icon: TrendingUp,
      tone: "amber",
    },
    {
      title: "Blocked Students",
      value: loading ? "..." : stats.blockedStudentsCount,
      note: "Students currently blocked or expired from portal access.",
      icon: Ban,
      tone: "rose",
    },
    {
      title: "Highest Attendance",
      value: loading ? "..." : stats.highestAttendanceStudents,
      note: "Students leading the portal on attendance right now.",
      icon: TrendingUp,
      tone: "emerald",
    },
    {
      title: "At Risk",
      value: loading ? "..." : stats.lowAttendanceStudents,
      note: "Students at 50% or below who need attention.",
      icon: AlertTriangle,
      tone: "amber",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fff7ed_22%,#f8fafc_58%,#f8fafc_100%)]">
      <div className="border-b border-white/70 bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_46%,#eef6ff_100%)] px-4 py-6 md:px-6">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-3xl">
            <SectionBadge icon={ShieldCheck} label="Admin Dashboard" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              Live portal highlights for admin
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
              This screen now starts with the genuine portal picture: today&apos;s
              student attendance, course-wise performance, blocked students, and
              the students who need attention first.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
                <Clock3 className="h-4 w-4 text-amber-600" />
                Updated {loading ? "..." : formatDateTime(stats.generatedAt)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
                <Activity className="h-4 w-4 text-blue-600" />
                Today {loading ? "..." : formatDateOnly(stats.todayAttendance.date)}
              </span>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,247,237,0.9),rgba(239,246,255,0.82))] p-5 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)]">
            <SectionBadge icon={Target} label="Today Overall Student Attendance" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Present
                </p>
                <p className="mt-3 text-4xl font-bold tracking-tight text-emerald-700">
                  {loading ? "..." : stats.todayAttendance.presentCount}
                </p>
              </div>
              <div className="rounded-[24px] border border-rose-100 bg-rose-50/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                  Absent
                </p>
                <p className="mt-3 text-4xl font-bold tracking-tight text-rose-700">
                  {loading ? "..." : stats.todayAttendance.absentCount}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Attendance Rate
                  </p>
                  <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                    {loading ? "..." : `${stats.todayAttendance.attendanceRate}%`}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>{loading ? "..." : `${stats.todayAttendance.markedStudents} marked`}</p>
                  <p>{loading ? "..." : `${stats.todayAttendance.unmarkedStudents} not marked yet`}</p>
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
                  style={{ width: `${stats.todayAttendance.attendanceRate}%` }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {loading ? "..." : stats.todayAttendance.approvedCourseEntries} approved course
                  entries
                </span>
                <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  {loading ? "..." : stats.todayAttendance.pendingCourseEntries} pending entries
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-4 md:p-6 md:pb-8">
        {error && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchStats}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metricCards.map((card) => (
            <MetricCard key={card.title} {...card} />
          ))}
        </div>

        <div>
          <SectionBadge icon={MessageSquareText} label="Faculty Review Pulse" />
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Student ratings for staff members
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                This dashboard block shows the latest faculty reviews with staff
                name, student name, course, and rating.
              </p>
            </div>
            <Link
              href="/dashboard/admin/faculty-reviews"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-amber-300 hover:text-amber-700"
            >
              Open full faculty reviews
            </Link>
          </div>

          {reviewError ? (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700 shadow-sm">
              {reviewError}
            </div>
          ) : null}

          <div className="mt-5 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,251,235,0.95),rgba(254,243,199,0.84))] p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.3)]">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/80 bg-white/92 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Total Reviews
                  </p>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
                    {reviewLoading ? "..." : reviewSummary.totalReviews}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/92 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Average Rating
                  </p>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-amber-700">
                    {reviewLoading
                      ? "..."
                      : `${reviewSummary.averageOverallRating} / 5`}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/80 bg-white/88 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-slate-900">
                    Top faculty review snapshot
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  {reviewLoading ? (
                    <p className="text-sm text-slate-500">Loading faculty ratings...</p>
                  ) : reviewSummary.facultySummary.length === 0 ? (
                    <p className="text-sm text-slate-500">No faculty reviews submitted yet.</p>
                  ) : (
                    reviewSummary.facultySummary.slice(0, 4).map((item) => (
                      <div
                        key={`${item.facultyId}-${item.facultyName}`}
                        className="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">
                              {item.facultyName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.facultyAssignedCourse || "Unassigned"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-amber-700">
                              {item.averageRating} / 5
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.reviewCount} review{item.reviewCount === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.3)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Latest Student Reviews
              </p>
              <h3 className="mt-2 text-xl font-bold text-slate-950">
                Staff name, student name, and course
              </h3>
              <div className="mt-5 space-y-3">
                {reviewLoading ? (
                  <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                    Loading faculty review feed...
                  </div>
                ) : reviewSummary.reviews.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                    No student reviews submitted yet.
                  </div>
                ) : (
                  reviewSummary.reviews.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-slate-950">
                              {item.facultyName}
                            </p>
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                              {item.overallRating} / 5
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            Student: <span className="font-semibold text-slate-900">{item.studentName}</span>
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Course: <span className="font-semibold text-slate-900">{item.course || "-"}</span>
                            {item.year ? ` | Year ${item.year}` : ""}
                          </p>
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                            {item.comment}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400">
                          {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <SectionBadge icon={BookOpen} label="Quick Actions" />
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Jump straight into the admin work areas
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                Use these when you want to move from the dashboard highlight to the
                page where the action happens.
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/dashboard/admin/attendance"
              className="rounded-[28px] border border-emerald-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,253,245,0.95),rgba(209,250,229,0.78))] p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.3)] transition hover:-translate-y-1"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CalendarDays className="h-5 w-5" />
              </span>
              <p className="mt-4 text-lg font-semibold text-slate-950">Student Attendance</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review, approve, and fix attendance entries course by course.
              </p>
            </Link>

            <Link
              href="/dashboard/admin/students"
              className="rounded-[28px] border border-blue-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.95),rgba(219,234,254,0.8))] p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.3)] transition hover:-translate-y-1"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Users className="h-5 w-5" />
              </span>
              <p className="mt-4 text-lg font-semibold text-slate-950">Students</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Open the student list for profile edits, block review, and portal fixes.
              </p>
            </Link>

            <Link
              href="/dashboard/admin/activity-logs"
              className="rounded-[28px] border border-rose-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,241,242,0.95),rgba(254,226,226,0.78))] p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.3)] transition hover:-translate-y-1"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <Ban className="h-5 w-5" />
              </span>
              <p className="mt-4 text-lg font-semibold text-slate-950">Access & Activity</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Dig into blocked students, last activity, and access windows.
              </p>
            </Link>

            <Link
              href="/dashboard/admin/stats"
              className="rounded-[28px] border border-amber-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,247,237,0.95),rgba(254,243,199,0.82))] p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.3)] transition hover:-translate-y-1"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <UsersRound className="h-5 w-5" />
              </span>
              <p className="mt-4 text-lg font-semibold text-slate-950">Full Statistics</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Open the longer analytics page for more complete reporting.
              </p>
            </Link>
          </div>
        </div>

        <div>
          <SectionBadge icon={GraduationCap} label="Course-Wise And Overall Percentage" />
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Course-wise attendance and portal status
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                Each course shows today&apos;s attendance, overall percentage, blocked
                student count, and a quick student preview for drill-down.
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="min-h-[280px] rounded-[28px] border border-white/80 bg-white/70 p-5 shadow-sm"
                />
              ))
            ) : stats.courseHighlights.length === 0 ? (
              <EmptyState text="No course highlights found." />
            ) : (
              stats.courseHighlights.map((item) => <CourseCard key={item.course} item={item} />)
            )}
          </div>
        </div>

        <div>
          <SectionBadge icon={Users} label="Drill Down" />
          <div className="mt-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Student lists that admin can act on
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
              These sections are kept below the highlights so the first screen stays
              focused, but the details are ready when admin wants to go deeper.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ExpandableSection
            title="Blocked Students"
            subtitle="Students blocked or expired from portal access."
            count={loading ? "..." : stats.blockedStudentsCount}
            icon={Ban}
            open={sections.blocked}
            onToggle={() => toggleSection("blocked")}
          >
            {stats.blockedStudentList.length === 0 ? (
              <EmptyState text="No blocked students found." />
            ) : (
              <div className="space-y-3">
                {stats.blockedStudentList.map((student) => (
                  <StudentRow key={student._id} student={student} variant="blocked" />
                ))}
              </div>
            )}
          </ExpandableSection>

          <ExpandableSection
            title="Highest Attendance"
            subtitle="Students currently leading the portal on attendance."
            count={loading ? "..." : stats.highestAttendanceStudents}
            icon={TrendingUp}
            open={sections.highest}
            onToggle={() => toggleSection("highest")}
          >
            {stats.highestAttendanceStudentList.length === 0 ? (
              <EmptyState text="No high-attendance students found." />
            ) : (
              <div className="space-y-3">
                {stats.highestAttendanceStudentList.map((student) => (
                  <StudentRow key={student._id} student={student} variant="high" />
                ))}
              </div>
            )}
          </ExpandableSection>

          <ExpandableSection
            title="Lowest Attendance"
            subtitle="Students currently at the bottom of the attendance list."
            count={loading ? "..." : stats.lowestAttendanceStudents}
            icon={TrendingDown}
            open={sections.lowest}
            onToggle={() => toggleSection("lowest")}
          >
            {stats.lowestAttendanceStudentList.length === 0 ? (
              <EmptyState text="No low-attendance students found." />
            ) : (
              <div className="space-y-3">
                {stats.lowestAttendanceStudentList.map((student) => (
                  <StudentRow key={student._id} student={student} variant="low" />
                ))}
              </div>
            )}
          </ExpandableSection>

          <ExpandableSection
            title="At-Risk Students"
            subtitle="Students at 50% or below who need follow-up quickly."
            count={loading ? "..." : stats.lowAttendanceStudents}
            icon={AlertTriangle}
            open={sections.atRisk}
            onToggle={() => toggleSection("atRisk")}
          >
            {stats.lowAttendanceStudentList.length === 0 ? (
              <EmptyState text="No at-risk students found." />
            ) : (
              <div className="space-y-3">
                {stats.lowAttendanceStudentList.map((student) => (
                  <StudentRow key={student._id} student={student} variant="low" />
                ))}
              </div>
            )}
          </ExpandableSection>

          <ExpandableSection
            title="Inactive Students"
            subtitle="Students with no attendance activity in the last 30 days."
            count={loading ? "..." : stats.inactiveStudents}
            icon={Activity}
            open={sections.inactive}
            onToggle={() => toggleSection("inactive")}
          >
            {stats.inactiveStudentList.length === 0 ? (
              <EmptyState text="No inactive students found." />
            ) : (
              <div className="space-y-3">
                {stats.inactiveStudentList.map((student) => (
                  <StudentRow key={student._id} student={student} />
                ))}
              </div>
            )}
          </ExpandableSection>

          <ExpandableSection
            title="Newly Registered Students"
            subtitle="Fresh student accounts added in the last 30 days."
            count={loading ? "..." : stats.newlyRegisteredStudents}
            icon={UserPlus}
            open={sections.recent}
            onToggle={() => toggleSection("recent")}
          >
            {stats.newlyRegisteredStudentList.length === 0 ? (
              <EmptyState text="No newly registered students found." />
            ) : (
              <div className="space-y-3">
                {stats.newlyRegisteredStudentList.map((student) => (
                  <StudentRow key={student._id} student={student} />
                ))}
              </div>
            )}
          </ExpandableSection>
        </div>
      </div>
    </div>
  );
}
