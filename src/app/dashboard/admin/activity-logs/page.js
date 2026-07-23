"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Ban,
  CalendarDays,
  Clock3,
  Filter,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "admin", label: "Admin" },
  { value: "faculty", label: "Faculty" },
  { value: "student", label: "Student" },
];

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "login", label: "Signed In" },
  { value: "logout", label: "Signed Out" },
  { value: "page_view", label: "Visited Page" },
  { value: "user_create", label: "Created User" },
  { value: "user_update", label: "Updated User" },
  { value: "user_delete", label: "Deleted User" },
  { value: "attendance_marked", label: "Marked Attendance" },
  { value: "attendance_approved", label: "Approved Attendance" },
  { value: "attendance_denied", label: "Denied Attendance" },
];

const REPORT_DAY_OPTIONS = [
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "15", label: "Last 15 days" },
  { value: "30", label: "Last 30 days" },
];

const INACTIVE_DAY_OPTIONS = [
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "15", label: "15 days" },
  { value: "30", label: "30 days" },
];

const IST_TIME_ZONE = "Asia/Kolkata";

function formatDateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPercent(value) {
  const numericValue = Number(value);
  return `${(Number.isFinite(numericValue) ? numericValue : 0).toFixed(1)}%`;
}

function formatDaysAgo(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "No activity record";
  }

  if (numericValue <= 0) {
    return "Today";
  }

  if (numericValue === 1) {
    return "1 day ago";
  }

  return `${numericValue} days ago`;
}

function getRoleChip(role) {
  if (role === "admin") {
    return "bg-amber-100 text-amber-700";
  }

  if (role === "faculty") {
    return "bg-indigo-100 text-indigo-700";
  }

  if (role === "student") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getInactiveTone(daysSinceLastActivity, hasActivity) {
  if (!hasActivity) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (Number(daysSinceLastActivity) >= 15) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (Number(daysSinceLastActivity) >= 7) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getAccessStatusChip(status) {
  if (status === "blocked" || status === "expired") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "scheduled" || status === "not_started") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatAccessStatus(status) {
  if (status === "blocked") return "Blocked";
  if (status === "expired") return "Expired";
  if (status === "active") return "Active Window";
  if (status === "not_started") return "Not Started";
  if (status === "scheduled") return "Scheduled";
  return "Unknown";
}

function formatTrackedStudent(student) {
  if (!student) return "-";

  const parts = [student.name || "Student"].filter(Boolean);

  return parts.join(" ");
}

function AttendanceLogMeta({ metadata }) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const presentStudents = Array.isArray(metadata.presentStudents)
    ? metadata.presentStudents
    : [];
  const absentStudents = Array.isArray(metadata.absentStudents)
    ? metadata.absentStudents
    : [];
  const changedStudents = Array.isArray(metadata.changedStudents)
    ? metadata.changedStudents
    : [];

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-700">
          Mode: {metadata.submissionMode || "saved"}
        </span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
          Present {Number(metadata.presentCount || 0)}
        </span>
        <span className="rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">
          Absent {Number(metadata.absentCount || 0)}
        </span>
        {Number(metadata.changedCount || 0) > 0 ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
            Changed {Number(metadata.changedCount || 0)}
          </span>
        ) : null}
      </div>

      {presentStudents.length > 0 ? (
        <p className="mt-3 leading-5">
          <span className="font-semibold text-slate-700">Present Students:</span>{" "}
          {presentStudents.map((student) => formatTrackedStudent(student)).join(", ")}
        </p>
      ) : null}

      {absentStudents.length > 0 ? (
        <p className="mt-2 leading-5">
          <span className="font-semibold text-slate-700">Absent Students:</span>{" "}
          {absentStudents.map((student) => formatTrackedStudent(student)).join(", ")}
        </p>
      ) : null}

      {changedStudents.length > 0 ? (
        <p className="mt-2 leading-5">
          <span className="font-semibold text-slate-700">Changed Status:</span>{" "}
          {changedStudents
            .map(
              (student) =>
                `${formatTrackedStudent(student)} ${student.fromStatus || "-"} to ${student.toStatus || "-"}`,
            )
            .join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function createEmptyStudentReport(reportDays, inactiveDays) {
  return {
    reportDays: Number(reportDays || 7),
    inactiveDays: Number(inactiveDays || 15),
    totalStudents: 0,
    inactiveStudentCount: 0,
    neverLoggedInCount: 0,
    blockedStudentCount: 0,
    activeWindowStudentCount: 0,
    accessStartDate: "",
    today: {
      label: "Today",
      loggedInCount: 0,
      loggedOutCount: 0,
      loginEventCount: 0,
      logoutEventCount: 0,
      loginPercentage: 0,
      logoutPercentage: 0,
    },
    daily: [],
    inactiveStudents: [],
    allStudents: [],
  };
}

function createEmptyExactUserStats() {
  return {
    total: 0,
    admin: 0,
    faculty: 0,
    student: 0,
  };
}

export default function AdminActivityLogsPage({
  lockedRole = "",
  pageTitle = "User Activity Timeline",
  pageDescription = "Review sign-ins, sign-outs, page visits, admin actions, and student login trends.",
  badgeLabel = "Activity Logs",
  showStudentReport = true,
}) {
  const [logs, setLogs] = useState([]);
  const [studentLoginReport, setStudentLoginReport] = useState(
    createEmptyStudentReport(7, 15),
  );
  const [exactUserStats, setExactUserStats] = useState(
    createEmptyExactUserStats(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(lockedRole);
  const [actionType, setActionType] = useState("");
  const [reportDays, setReportDays] = useState("7");
  const [inactiveDays, setInactiveDays] = useState("15");
  const [studentTab, setStudentTab] = useState("attention");

  useEffect(() => {
    setRole(lockedRole);
  }, [lockedRole]);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({ limit: "120" });

        if (showStudentReport) {
          params.set("reportDays", reportDays);
          params.set("inactiveDays", inactiveDays);
        }

        if (role) params.set("role", role);
        if (actionType) params.set("actionType", actionType);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/activity-logs?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || `Failed (HTTP ${res.status})`);
        }

        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setStudentLoginReport(
          showStudentReport
            ? data.studentLoginReport ||
                createEmptyStudentReport(reportDays, inactiveDays)
            : createEmptyStudentReport(reportDays, inactiveDays),
        );
        setExactUserStats(data.exactUserStats || createEmptyExactUserStats());
      } catch (loadError) {
        setError(loadError.message || "Unable to load activity logs");
        setLogs([]);
        setStudentLoginReport(createEmptyStudentReport(reportDays, inactiveDays));
        setExactUserStats(createEmptyExactUserStats());
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [role, actionType, search, reportDays, inactiveDays, showStudentReport]);
  const dailySnapshots = Array.isArray(studentLoginReport?.daily)
    ? studentLoginReport.daily
    : [];
  const inactiveStudents = Array.isArray(studentLoginReport?.inactiveStudents)
    ? studentLoginReport.inactiveStudents
    : [];
  const allStudents = Array.isArray(studentLoginReport?.allStudents)
    ? studentLoginReport.allStudents
    : [];
  const todaySnapshot = studentLoginReport?.today || {
    label: "Today",
    loggedInCount: 0,
    loggedOutCount: 0,
    loginEventCount: 0,
    logoutEventCount: 0,
    loginPercentage: 0,
    logoutPercentage: 0,
  };
  const studentTabOptions = useMemo(
    () => [
      {
        key: "attention",
        label: "Needs Attention",
        count: inactiveStudents.length,
      },
      {
        key: "blocked",
        label: "Blocked / Expired",
        count: allStudents.filter(
          (student) =>
            student.accessStatus === "blocked" ||
            student.accessStatus === "expired",
        ).length,
      },
      {
        key: "never",
        label: "Never Logged In",
        count: allStudents.filter((student) => !student.lastLoginAt).length,
      },
      {
        key: "all",
        label: "All Students",
        count: allStudents.length,
      },
    ],
    [allStudents, inactiveStudents.length],
  );
  const visibleStudents = useMemo(() => {
    if (studentTab === "blocked") {
      return allStudents.filter(
        (student) =>
          student.accessStatus === "blocked" ||
          student.accessStatus === "expired",
      );
    }

    if (studentTab === "never") {
      return allStudents.filter((student) => !student.lastLoginAt);
    }

    if (studentTab === "all") {
      return allStudents;
    }

    return inactiveStudents;
  }, [allStudents, inactiveStudents, studentTab]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
            <Activity className="h-3.5 w-3.5" />
            {badgeLabel}
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {pageDescription}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total",
              value: exactUserStats.total,
              tone: "text-slate-900",
            },
            {
              label: "Admins",
              value: exactUserStats.admin,
              tone: "text-amber-700",
            },
            {
              label: "Faculty",
              value: exactUserStats.faculty,
              tone: "text-indigo-700",
            },
            {
              label: "Students",
              value: exactUserStats.student,
              tone: "text-emerald-700",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.label}
              </p>
              <p className={`mt-2 text-2xl font-bold ${item.tone}`}>{item.value}</p>
              <p className="mt-2 text-xs text-slate-500">Exact users in database</p>
            </div>
          ))}
        </div>
      </div>

      {showStudentReport ? (
        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                <Users className="h-3.5 w-3.5" />
                Student Login Report
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">
                Today and past-day login report for students
              </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This report is student-only. It shows how many students signed in,
                  how many signed out, the percentage out of total students, the raw
                  event count behind those actions, plus which students have been
                  inactive for the selected past-day range.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Report Range
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <select
                    value={reportDays}
                    onChange={(e) => setReportDays(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
                  >
                    {REPORT_DAY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Inactivity Alert
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <UserX className="h-4 w-4 text-slate-400" />
                  <select
                    value={inactiveDays}
                    onChange={(e) => setInactiveDays(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
                  >
                    {INACTIVE_DAY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              {
                label: "Total Students",
                value: studentLoginReport.totalStudents,
                note: "All registered students",
                tone: "text-slate-900",
                icon: Users,
              },
              {
                label: `Signed In ${todaySnapshot.label}`,
                value: todaySnapshot.loggedInCount,
                note: `${formatPercent(todaySnapshot.loginPercentage)} of total students • ${todaySnapshot.loginEventCount} login events`,
                tone: "text-emerald-700",
                icon: LogIn,
              },
              {
                label: "Login Percentage",
                value: formatPercent(todaySnapshot.loginPercentage),
                note: "Share of total students",
                tone: "text-emerald-700",
                icon: Activity,
              },
              {
                label: `Signed Out ${todaySnapshot.label}`,
                value: todaySnapshot.loggedOutCount,
                note: `${formatPercent(todaySnapshot.logoutPercentage)} of total students • ${todaySnapshot.logoutEventCount} logout events`,
                tone: "text-indigo-700",
                icon: LogOut,
              },
              {
                label: "Logout Percentage",
                value: formatPercent(todaySnapshot.logoutPercentage),
                note: "Share of total students",
                tone: "text-indigo-700",
                icon: Filter,
              },
              {
                label: `No Activity ${studentLoginReport.inactiveDays}d`,
                value: studentLoginReport.inactiveStudentCount,
                note: `${studentLoginReport.neverLoggedInCount} never logged in`,
                tone: "text-rose-700",
                icon: UserX,
              },
              {
                label: "Blocked Access",
                value: studentLoginReport.blockedStudentCount || 0,
                note: "Students whose 15 working-day window ended",
                tone: "text-rose-700",
                icon: Ban,
              },
              {
                label: "Active Window",
                value: studentLoginReport.activeWindowStudentCount || 0,
                note: "Window follows each student's latest activity",
                tone: "text-emerald-700",
                icon: ShieldCheck,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </p>
                      <p className={`mt-3 text-2xl font-bold ${item.tone}`}>
                        {item.value}
                      </p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">{item.note}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl border border-amber-100 bg-amber-50/70 px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Login Access Rule
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  Student access is tracked with 15 working days
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Last Login is kept separately for authentication history. Blocking and inactivity now follow each student&apos;s latest recorded portal activity. If admin resets the student password, the next login starts a fresh record. Sundays and holidays are skipped.
                </p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
                <AlertTriangle className="h-5 w-5" />
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70">
              <div className="border-b border-slate-200 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Daily Student Report
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  Login and logout numbers by day
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Student counts are unique students per day. Event counts show all
                  raw login/logout records stored in the database.
                </p>
              </div>

              {dailySnapshots.length === 0 ? (
                <div className="px-5 py-8 text-sm text-slate-500">
                  No student login activity has been recorded for this range yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-white/80 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Day</th>
                        <th className="px-5 py-3">Students Signed In</th>
                        <th className="px-5 py-3">Login %</th>
                        <th className="px-5 py-3">Login Events</th>
                        <th className="px-5 py-3">Students Signed Out</th>
                        <th className="px-5 py-3">Logout %</th>
                        <th className="px-5 py-3">Logout Events</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dailySnapshots.map((day) => (
                        <tr key={day.dayKey} className="bg-white/70">
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {day.label}
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {day.loggedInCount}
                          </td>
                          <td className="px-5 py-4 text-emerald-700">
                            {formatPercent(day.loginPercentage)}
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {day.loginEventCount}
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {day.loggedOutCount}
                          </td>
                          <td className="px-5 py-4 text-indigo-700">
                            {formatPercent(day.logoutPercentage)}
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {day.logoutEventCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70">
              <div className="border-b border-slate-200 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700">
                  Student Access Review
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  Student login access and inactivity
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Includes students with no activity in the last {studentLoginReport.inactiveDays} day
                  {Number(studentLoginReport.inactiveDays) === 1 ? "" : "s"}, plus their current access-window state.
                </p>
              </div>

              <div className="border-b border-slate-200 bg-white/80 px-5 py-3">
                <div className="flex flex-wrap gap-2">
                  {studentTabOptions.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setStudentTab(tab.key)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                        studentTab === tab.key
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>

              {visibleStudents.length === 0 ? (
                <div className="px-5 py-8 text-sm text-emerald-700">
                  No students found in this tab right now.
                </div>
              ) : (
                <div className="max-h-[520px] divide-y divide-slate-200 overflow-y-auto">
                  {visibleStudents.map((student) => {
                    const tone = getInactiveTone(
                      student.daysSinceLastActivity,
                      Boolean(student.lastActivityAt),
                    );

                    return (
                      <div key={student.studentId} className="bg-white/80 px-5 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-950">
                                {student.name}
                              </p>
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${tone}`}
                              >
                                {formatDaysAgo(student.daysSinceLastActivity)}
                              </span>
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getAccessStatusChip(student.accessStatus)}`}
                              >
                                {formatAccessStatus(student.accessStatus)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              {student.course} • Year {student.year}
                            </p>
                            <p className="mt-1 break-all text-xs text-slate-500">
                              {student.email || "-"}
                            </p>
                            <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-4">
                              <p>
                                <span className="font-semibold text-slate-700">Window Start:</span>{" "}
                                {student.accessWindowStartDate || "Not started"}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-700">Window End:</span>{" "}
                                {student.accessWindowEndDate || "-"}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-700">Last Activity:</span>{" "}
                                {student.lastActivityAt
                                  ? formatDateTime(student.lastActivityAt)
                                  : "Never"}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-700">Blocked At:</span>{" "}
                                {student.blockedAt ? formatDateTime(student.blockedAt) : "-"}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:text-right">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Last Activity
                              </p>
                              <p className="mt-2 text-sm font-medium text-slate-900">
                                {student.lastActivityAt
                                  ? formatDateTime(student.lastActivityAt)
                                  : "Never"}
                              </p>
                            </div>

                            <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Last Login
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-900">
                              {student.lastLoginAt
                                ? formatDateTime(student.lastLoginAt)
                                : "Never"}
                            </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        </section>
      ) : null}

      <div className="mb-5 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1.2fr_0.45fr_0.55fr]">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, email, action, path, or details"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </label>

        {lockedRole ? (
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
            <UserRound className="h-4 w-4" />
            Faculty activity only
          </div>
        ) : (
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <UserRound className="h-4 w-4 text-slate-400" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500" />

        {loading ? (
          <div className="flex items-center justify-center px-6 py-10 text-sm text-slate-500">
            <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
            Loading activity logs...
          </div>
        ) : error ? (
          <div className="px-6 py-6 text-sm text-red-600">{error}</div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No activity found for the selected filters yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {logs.map((log) => (
              <div
                key={log._id}
                className="grid gap-4 px-6 py-5 xl:grid-cols-[1.2fr_1fr_0.8fr]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-950">
                      {log.actorName}
                    </h2>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getRoleChip(
                        log.actorRole,
                      )}`}
                    >
                      {log.actorRole || "unknown"}
                    </span>
                    {log.targetName ? (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                        Target {log.targetRole || "user"}
                      </span>
                    ) : null}
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {log.actionType || "event"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {log.actionLabel}
                  </p>
                  {log.details ? (
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {log.details}
                    </p>
                  ) : null}
                  {log.actionType === "attendance_marked" ? (
                    <AttendanceLogMeta metadata={log.metadata} />
                  ) : null}
                </div>

                <div className="min-w-0 space-y-2 text-sm text-slate-500">
                  <p>
                    <span className="font-semibold text-slate-700">Email:</span>{" "}
                    {log.actorEmail || "-"}
                  </p>
                  {log.targetName ? (
                    <p>
                      <span className="font-semibold text-slate-700">Target:</span>{" "}
                      {log.targetName}
                      {log.targetEmail ? ` (${log.targetEmail})` : ""}
                    </p>
                  ) : null}
                  {log.path ? (
                    <p className="break-all">
                      <span className="font-semibold text-slate-700">Path:</span>{" "}
                      {log.path}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-start gap-3 xl:justify-end">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDateTime(log.createdAt)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Recorded Event
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
