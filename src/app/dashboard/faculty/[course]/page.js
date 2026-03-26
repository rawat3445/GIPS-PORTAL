"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const COURSE_MAP = {
  BPT: "Bachelor of Physiotherapy",
  BOPTOM: "Bachelor of Optometry",
  BMRIT: "Medical Radiology & Imaging",
  DOPTOM: "Diploma in Optometry",
  BOTT: "Operation Theater Technology",
};

const ATTENDANCE_START_MONTH = "2026-01";
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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
    case "present":
      return "border-green-200 bg-green-50 text-green-800";
    case "absent":
      return "border-red-200 bg-red-50 text-red-800";
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
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "holiday":
      return "Holiday";
    case "vacation":
      return "Vacation";
    default:
      return "Not Marked";
  }
}

function AttendanceSummaryModal({
  summary,
  loading,
  error,
  monthKey,
  onMonthChange,
  onClose,
}) {
  const maxMonthKey = useMemo(() => {
    const endDate = summary?.calendarEndDate || summary?.currentDate;
    return endDate ? endDate.slice(0, 7) : getCurrentMonthKey();
  }, [summary]);

  const selectedMonthStats = useMemo(() => {
    return (
      summary?.months?.find((item) => item.monthKey === monthKey) || {
        monthKey,
        label: monthKey,
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

    for (let i = 0; i < startDay; i += 1) cells.push(null);
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

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 px-3 py-3 md:items-center md:px-4 md:py-6">
      <div className="max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl md:max-h-[92vh]">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6 md:py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
              Student Attendance Summary
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {summary?.student?.name || "Loading..."} | {summary?.student?.course || "-"} | Year{" "}
              {summary?.student?.year || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-end rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 sm:self-auto"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-4 md:space-y-6 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <p className="text-sm leading-6 text-gray-600">
              Full attendance record with calendar view, monthly percentage, and overall percentage.
            </p>
            <div className="w-full max-w-xs">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Month
              </label>
              <input
                type="month"
                min={ATTENDANCE_START_MONTH}
                max={maxMonthKey}
                value={monthKey}
                onChange={(e) => onMonthChange(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              Loading attendance summary...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Monthly %</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {selectedMonthStats.percentage}%
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Overall %</p>
                  <p className="mt-2 text-2xl font-bold text-indigo-700">
                    {overall.percentage}%
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">
                    {selectedMonthStats.present}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {selectedMonthStats.absent}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Working Days</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {selectedMonthStats.workingDays}
                  </p>
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
                            <p className="mt-2 text-[10px] leading-4 md:mt-3 md:text-[11px]">{item.note}</p>
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
            </>
          )}
        </div>
      </div>

      {selectedStudentId && (
        <AttendanceSummaryModal
          summary={studentSummary}
          loading={summaryLoading}
          error={summaryError}
          monthKey={summaryMonthKey}
          onMonthChange={setSummaryMonthKey}
          onClose={() => {
            setSelectedStudentId("");
            setStudentSummary(null);
            setSummaryError("");
          }}
        />
      )}
    </div>
  );
}

export default function FacultyCoursePage() {
  const router = useRouter();
  const params = useParams(); // { course: "BMRIT" } [web:507]
  const course = String(params.course || "").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");

  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");
  const [students, setStudents] = useState([]);
  const [highestAttendance, setHighestAttendance] = useState([]);
  const [highestAttendanceLoading, setHighestAttendanceLoading] = useState(true);
  const [highestAttendanceError, setHighestAttendanceError] = useState("");
  const [showHighestAttendance, setShowHighestAttendance] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSummary, setStudentSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryMonthKey, setSummaryMonthKey] = useState(getCurrentMonthKey());

  const courseName = useMemo(() => COURSE_MAP[course], [course]);

  // 1) Auth + access check
  useEffect(() => {
    const run = async () => {
      setError("");

      if (!courseName) {
        setLoading(false);
        setError("Invalid course route");
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          router.replace("/login");
          return;
        }

        const user = data.user;
        setMe(user);

        if (String(user?.role || "").toLowerCase() !== "faculty") {
          router.replace(
            `/dashboard/${String(user?.role || "").toLowerCase()}`
          );
          return;
        }

        if (!user?.assignedCourse) {
          router.replace("/dashboard/faculty");
          return;
        }

        if (String(user.assignedCourse).toUpperCase() !== course) {
          router.replace(`/dashboard/faculty/${user.assignedCourse}`);
          return;
        }
      } catch (e) {
        setError("Failed to load course dashboard");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [course, courseName, router]);

  // 2) Fetch students list for this course (after auth finished)
  useEffect(() => {
    const loadStudents = async () => {
      if (!courseName) return;
      if (loading) return;
      if (!me) return; // only fetch after /me is loaded

      setStudentsLoading(true);
      setStudentsError("");

      try {
        const res = await fetch(`/api/faculty/students?course=${course}`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data.message || `Failed to load students (HTTP ${res.status})`
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("Students API did not return an array");
        }

        setStudents(data);
      } catch (e) {
        setStudents([]);
        setStudentsError(e.message || "Failed to load students");
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, [course, courseName, loading, me]);

  useEffect(() => {
    const loadHighestAttendance = async () => {
      if (!courseName) return;
      if (loading) return;
      if (!me) return;

      setHighestAttendanceLoading(true);
      setHighestAttendanceError("");

      try {
        const res = await fetch("/api/faculty/stats", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data.message || `Failed to load attendance leaders (HTTP ${res.status})`
          );
        }

        setHighestAttendance(
          Array.isArray(data.highestAttendanceStudentList)
            ? data.highestAttendanceStudentList
            : []
        );
      } catch (e) {
        setHighestAttendance([]);
        setHighestAttendanceError(e.message || "Failed to load attendance leaders");
      } finally {
        setHighestAttendanceLoading(false);
      }
    };

    loadHighestAttendance();
  }, [courseName, loading, me]);

  const yearCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const s of students) {
      const y = Number(s.year);
      if (counts[y] !== undefined) counts[y] += 1;
    }
    return counts;
  }, [students]);

  async function openStudentSummary(studentId) {
    try {
      setSelectedStudentId(studentId);
      setStudentSummary(null);
      setSummaryError("");
      setSummaryLoading(true);
      setSummaryMonthKey(getCurrentMonthKey());

      const res = await fetch(
        `/api/faculty/students/attendance?view=summary&studentId=${studentId}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to load student attendance");
      }

      setStudentSummary(data);
    } catch (e) {
      setSummaryError(e.message || "Failed to load student attendance");
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <button
          className="mt-3 rounded bg-indigo-600 px-3 py-2 text-white text-sm"
          onClick={() => router.push("/dashboard/faculty")}
        >
          Go to Faculty Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {course} Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">{courseName}</p>
            <p className="text-xs text-gray-500 mt-1">
              Faculty: {me?.name || "-"}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/dashboard/faculty"
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Faculty Home
            </Link>
            <Link
              href={`/dashboard/faculty/${course}/attendance`}
              className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
            >
              Mark Attendance
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-5">
            <p className="text-sm text-gray-600">Total students</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {studentsLoading ? "..." : students.length}
            </p>
          </div>

          <div className="bg-white border rounded-lg p-5">
            <p className="text-sm text-gray-600">Year 1</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {studentsLoading ? "..." : yearCounts[1]}
            </p>
          </div>

          <div className="bg-white border rounded-lg p-5">
            <p className="text-sm text-gray-600">Year 2</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {studentsLoading ? "..." : yearCounts[2]}
            </p>
          </div>

          <div className="bg-white border rounded-lg p-5">
            <p className="text-sm text-gray-600">Highest Attendance</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {highestAttendanceLoading ? "..." : highestAttendance.length}
            </p>
            <p className="text-xs text-emerald-600 mt-1">Top student performers</p>
          </div>

          <div className="bg-white border rounded-lg p-5">
            <p className="text-sm text-gray-600">Year 3-4</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {studentsLoading ? "..." : yearCounts[3] + yearCounts[4]}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            className="bg-white border rounded-lg p-4 hover:bg-gray-50"
            href={`/dashboard/faculty/${course}/students`}
          >
            Students module
          </Link>

          <Link
            className="bg-white border rounded-lg p-4 hover:bg-gray-50"
            href={`/dashboard/faculty/${course}/attendance`}
          >
            Attendance module
          </Link>

          <Link
            className="bg-white border rounded-lg p-4 hover:bg-gray-50"
            href={`/dashboard/faculty/${course}/materials`}
          >
            Materials module
          </Link>
        </div>

        <div className="bg-white border rounded-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Highest Attendance Students
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Top attendance performers in {course}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHighestAttendance((prev) => !prev)}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              {showHighestAttendance ? "Hide" : "Show"}
            </button>
          </div>

          {showHighestAttendance && (
            <div className="p-6">
              {highestAttendanceLoading ? (
                <p className="text-sm text-gray-600">Loading attendance leaders...</p>
              ) : highestAttendanceError ? (
                <p className="text-sm text-red-600">{highestAttendanceError}</p>
              ) : highestAttendance.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No attendance leader data found yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {highestAttendance.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => openStudentSummary(student._id)}
                          className="text-left text-sm font-semibold text-gray-900 hover:text-indigo-700 hover:underline"
                        >
                          {student.name}
                        </button>
                        <p className="mt-1 text-xs text-gray-600">
                          {student.enrollmentNo || "-"} | {student.course || "-"} | Year{" "}
                          {student.year || "-"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{student.email}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {student.attendancePercentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Students list (real data) */}
        <div className="bg-white border rounded-lg">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Students ({studentsLoading ? "..." : students.length})
            </h2>
            <p className="text-xs text-gray-500">
              Showing students enrolled in {course}. Click a student name to
              open the full attendance record.
            </p>
          </div>

          {studentsLoading ? (
            <div className="p-6 text-sm text-gray-600">Loading students...</div>
          ) : studentsError ? (
            <div className="p-6 text-sm text-red-600">{studentsError}</div>
          ) : students.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              No students found for this course yet.
              <div className="mt-2 text-xs text-gray-500">
                Tip: When admin adds a student, ensure course is exactly{" "}
                <b>{course}</b>.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-6 py-3">Name</th>
                    <th className="text-left px-6 py-3">Enrollment</th>
                    <th className="text-left px-6 py-3">Year</th>
                    <th className="text-left px-6 py-3">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">
                        <button
                          type="button"
                          onClick={() => openStudentSummary(s._id)}
                          className="text-left text-gray-900 hover:text-indigo-700 hover:underline"
                        >
                          {s.name}
                        </button>
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {s.enrollmentNo || "-"}
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {s.year || "-"}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
