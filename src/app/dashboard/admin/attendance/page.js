"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const ATTENDANCE_START_MONTH = "2026-01";
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COURSE_OPTIONS = ["BPT", "BOPTOM", "BMRIT", "DOPTOM", "BOTT"];
const YEAR_OPTIONS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

function getScopeLabel(scopeType, course, year, studentCount = 0) {
  if (scopeType === "student") {
    if (course && year) {
      return `${course} Year ${year} (${studentCount} selected student${studentCount === 1 ? "" : "s"})`;
    }
    return "selected students";
  }

  if (scopeType === "courseYear") {
    return course && year ? `${course} Year ${year}` : "selected course and year";
  }

  if (scopeType === "course") {
    return course ? `${course} (all years)` : "selected course";
  }

  return "all courses";
}

function getAppliedEventLabel(eventInfo) {
  if (!eventInfo) return "";
  return getScopeLabel(eventInfo.scopeType, eventInfo.course, eventInfo.year, eventInfo.scopeType === "student" ? 1 : 0);
}

function getEventTypeLabel(eventType) {
  if (eventType === "internship") return "Internship";
  if (eventType === "event") return "Event";
  return "Holiday";
}

function getEventTypeClasses(eventType) {
  if (eventType === "internship") {
    return "border-cyan-200 bg-cyan-50 text-cyan-800";
  }

  if (eventType === "event") {
    return "border-violet-200 bg-violet-50 text-violet-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Student Attendance Summary
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {summary?.student?.name || "Loading..."} | {summary?.student?.course || "-"} |
              {" "}Year {summary?.student?.year || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            X
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Attendance from {summary?.startDate || "2026-01-01"} with winter
                vacation and Sundays excluded from working-day rules.
              </p>
            </div>
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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Monthly %</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {selectedMonthStats.percentage}%
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Overall %</p>
                  <p className="mt-2 text-2xl font-bold text-blue-700">
                    {overall.percentage}%
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">Working Days</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {selectedMonthStats.workingDays}
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
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Attendance Calendar
                      </h3>
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

                  <div className="grid grid-cols-7 gap-3">
                    {WEEK_DAYS.map((day) => (
                      <div
                        key={day}
                        className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {day}
                      </div>
                    ))}

                    {monthGrid.map((item, index) =>
                      item ? (
                        <div
                          key={`${monthKey}-${item.day}-${index}`}
                          className={`min-h-[84px] rounded-xl border p-3 ${getStatusClasses(
                            item.status
                          )}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold">{item.day}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                              {getStatusLabel(item.status)}
                            </span>
                          </div>
                          {item.note && (
                            <p className="mt-3 text-[11px] leading-4">{item.note}</p>
                          )}
                        </div>
                      ) : (
                        <div
                          key={`${monthKey}-empty-${index}`}
                          className="min-h-[84px] rounded-xl border border-transparent"
                        />
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Overall Summary
                    </h3>
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

                  <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Monthly Percentages
                    </h3>
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
                                Present {month.present} | Absent {month.absent}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminAttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState(getTodayISO());
  const [eventFromDate, setEventFromDate] = useState(getTodayISO());
  const [eventToDate, setEventToDate] = useState(getTodayISO());
  const [eventScopeType, setEventScopeType] = useState("global");
  const [eventType, setEventType] = useState("holiday");
  const [eventCourse, setEventCourse] = useState("");
  const [eventYear, setEventYear] = useState("");
  const [eventStudentIds, setEventStudentIds] = useState([]);
  const [eventStudents, setEventStudents] = useState([]);
  const [eventStudentsLoading, setEventStudentsLoading] = useState(false);
  const [eventStudentsError, setEventStudentsError] = useState("");
  const [holidayTitle, setHolidayTitle] = useState("");
  const [holidayInfo, setHolidayInfo] = useState(null);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [holidayMessage, setHolidayMessage] = useState("");
  const [holidayError, setHolidayError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSummary, setStudentSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryMonthKey, setSummaryMonthKey] = useState(getCurrentMonthKey());
  const holidayStatus = holidaySaving
    ? "Saving event range..."
    : holidayError
    ? holidayError
    : holidayMessage
    ? holidayMessage
    : holidayInfo
    ? `An event already applies on ${date} for ${getAppliedEventLabel(holidayInfo)}: ${holidayInfo.title || getEventTypeLabel(holidayInfo.eventType)}`
    : "Pick an attendance date to preview active events, then create a new event range below.";

  useEffect(() => {
    if (eventScopeType !== "student") {
      setEventStudents([]);
      setEventStudentsLoading(false);
      setEventStudentsError("");
      return;
    }

    if (!eventCourse || !eventYear) {
      setEventStudents([]);
      setEventStudentsLoading(false);
      setEventStudentsError("");
      return;
    }

    let cancelled = false;

    async function loadEventStudents() {
      try {
        setEventStudentsLoading(true);
        setEventStudentsError("");

        const params = new URLSearchParams({
          course: eventCourse,
          year: eventYear,
        });
        if (date) params.append("date", date);

        const res = await fetch(`/api/faculty/students?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || `Failed (HTTP ${res.status})`);
        }

        if (!Array.isArray(data)) {
          throw new Error("Students API did not return an array");
        }

        if (!cancelled) {
          setEventStudents(data);
          setEventStudentIds((prev) =>
            prev.filter((studentId) =>
              data.some((student) => student._id === studentId)
            )
          );
        }
      } catch (err) {
        if (!cancelled) {
          setEventStudents([]);
          setEventStudentsError(err.message || "Failed to load students");
        }
      } finally {
        if (!cancelled) {
          setEventStudentsLoading(false);
        }
      }
    }

    loadEventStudents();

    return () => {
      cancelled = true;
    };
  }, [date, eventCourse, eventScopeType, eventYear]);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (course) params.append("course", course);
      if (year) params.append("year", year);
      if (date) params.append("date", date);

      const res = await fetch(`/api/admin/attendance?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load attendance");

      setAttendance(data);
    } catch (err) {
      setError(err.message || "Error loading attendance");
    } finally {
      setLoading(false);
    }
  }, [course, date, year]);

  const fetchHolidayInfo = useCallback(async (nextDate = date) => {
    if (!nextDate) {
      setHolidayInfo(null);
      return;
    }

    try {
      setHolidayLoading(true);
      setHolidayError("");

      const params = new URLSearchParams({ date: nextDate });
      if (course) params.append("course", course);
      if (year) params.append("year", year);

      const res = await fetch(`/api/admin/holidays?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load holiday");
      }

      setHolidayInfo(data);
      if (data?.title) {
        setHolidayTitle(data.title);
      }
      if (data?.eventType) {
        setEventType(data.eventType);
      }
    } catch (err) {
      setHolidayInfo(null);
      setHolidayError(err.message || "Failed to load holiday");
    } finally {
      setHolidayLoading(false);
    }
  }, [course, date, year]);

  async function saveHoliday() {
    if (!eventFromDate || !eventToDate) {
      setHolidayError("Choose a start date and end date for the event.");
      return;
    }

    if (eventScopeType !== "global" && !eventCourse) {
      setHolidayError("Choose a course for the selected event scope.");
      return;
    }

    if ((eventScopeType === "courseYear" || eventScopeType === "student") && !eventYear) {
      setHolidayError("Choose a year for the selected event scope.");
      return;
    }

    if (eventScopeType === "student" && eventStudentIds.length === 0) {
      setHolidayError("Choose at least one student for this event range.");
      return;
    }

    try {
      setHolidaySaving(true);
      setHolidayMessage("");
      setHolidayError("");

      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fromDate: eventFromDate,
          toDate: eventToDate,
          title: holidayTitle.trim() || "Holiday",
          eventType,
          scopeType: eventScopeType,
          course: eventCourse,
          year:
            eventScopeType === "courseYear" || eventScopeType === "student"
              ? Number(eventYear)
              : undefined,
          studentIds:
            eventScopeType === "student" ? eventStudentIds : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to save holiday");
      }

      setHolidayInfo(data.holiday);
      setHolidayTitle(data.holiday?.title || "Holiday");
      setEventType(data.holiday?.eventType || eventType);
      const successMessage =
        data.message ||
        `${holidayTitle.trim() || "Holiday"} saved for ${getScopeLabel(
          eventScopeType,
          eventCourse,
          eventYear,
          eventStudentIds.length
        )} from ${eventFromDate} to ${eventToDate}`;
      setHolidayMessage(successMessage);
      if (eventScopeType !== "student") {
        await fetchHolidayInfo(date);
      }
      fetchAttendance();
      window.alert(successMessage);
    } catch (err) {
      const errorMessage = err.message || "Failed to save holiday";
      setHolidayError(errorMessage);
      window.alert(errorMessage);
    } finally {
      setHolidaySaving(false);
    }
  }

  async function removeConfiguredHoliday() {
    if (!eventFromDate || !eventToDate) {
      setHolidayError("Choose a start date and end date for the event.");
      return;
    }

    if (eventScopeType !== "global" && !eventCourse) {
      setHolidayError("Choose a course for the selected event scope.");
      return;
    }

    if ((eventScopeType === "courseYear" || eventScopeType === "student") && !eventYear) {
      setHolidayError("Choose a year for the selected event scope.");
      return;
    }

    if (eventScopeType === "student" && eventStudentIds.length === 0) {
      setHolidayError("Choose at least one student for this event range.");
      return;
    }

    try {
      setHolidaySaving(true);
      setHolidayMessage("");
      setHolidayError("");

      const res = await fetch("/api/admin/holidays", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fromDate: eventFromDate,
          toDate: eventToDate,
          scopeType: eventScopeType,
          course: eventCourse,
          year:
            eventScopeType === "courseYear" || eventScopeType === "student"
              ? Number(eventYear)
              : undefined,
          studentIds:
            eventScopeType === "student" ? eventStudentIds : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to remove event");
      }

      setHolidayInfo(null);
      setHolidayMessage(data.message || "Event removed successfully");
      if (eventScopeType !== "student") {
        await fetchHolidayInfo(date);
      }
      fetchAttendance();
      window.alert(data.message || "Event removed successfully");
    } catch (err) {
      const errorMessage = err.message || "Failed to remove event";
      setHolidayError(errorMessage);
      window.alert(errorMessage);
    } finally {
      setHolidaySaving(false);
    }
  }

  async function openStudentSummary(studentId) {
    try {
      setSelectedStudentId(studentId);
      setSummaryLoading(true);
      setSummaryError("");
      setStudentSummary(null);
      setSummaryMonthKey(getCurrentMonthKey());

      const res = await fetch(
        `/api/admin/attendance?view=summary&studentId=${studentId}`,
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
    } catch (err) {
      setSummaryError(err.message || "Failed to load student attendance");
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    setHolidayMessage("");
    setHolidayError("");
    fetchHolidayInfo();
  }, [fetchHolidayInfo]);

  async function removeHoliday() {
    if (!holidayInfo) return;

    try {
      setHolidaySaving(true);
      setHolidayMessage("");
      setHolidayError("");

      const res = await fetch("/api/admin/holidays", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fromDate: holidayInfo.fromDate || holidayInfo.date,
          toDate: holidayInfo.toDate || holidayInfo.date,
          scopeType: holidayInfo.scopeType || "global",
          course: holidayInfo.course || "",
          year: holidayInfo.year ?? undefined,
          studentIds:
            holidayInfo.scopeType === "student"
              ? eventStudentIds.length
                ? eventStudentIds
                : holidayInfo.studentId
                ? [holidayInfo.studentId]
                : []
              : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to remove event");
      }

      setHolidayMessage(data.message || "Event removed successfully");
      setHolidayInfo(null);
      if (holidayInfo.scopeType !== "student") {
        await fetchHolidayInfo(date);
      }
      fetchAttendance();
    } catch (err) {
      setHolidayError(err.message || "Failed to remove event");
    } finally {
      setHolidaySaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-950">Attendance</h1>
        <p className="text-sm font-medium text-gray-700">
          View attendance of all students across all courses
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            {COURSE_OPTIONS.map((courseOption) => (
              <option key={courseOption} value={courseOption}>
                {courseOption}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            {YEAR_OPTIONS.map((yearOption) => (
              <option key={yearOption.value} value={yearOption.value}>
                {yearOption.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={fetchAttendance}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition"
          >
            Filter
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-5 shadow-sm">
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${
              holidayError
                ? "border border-red-200 bg-red-50 text-red-700"
                : holidayMessage
                ? "border border-green-200 bg-green-50 text-green-700"
                : holidayInfo
                ? "border border-amber-200 bg-amber-100 text-amber-900"
                : "border border-gray-200 bg-white text-gray-700"
            }`}
          >
            {holidayStatus}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Event Builder
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                Mark Event / Holiday Range
              </p>
              <p className="mt-2 max-w-2xl text-sm text-gray-700">
                Create one event for a full date range, like internship days,
                college off, training, workshop, or department leave. You can
                apply it to all courses, one course, one specific course-year
                batch, or only selected students inside that batch.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Event Title
              </label>
              <input
                type="text"
                value={holidayTitle}
                onChange={(e) => setHolidayTitle(e.target.value)}
                placeholder="Internship, workshop, college off..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={eventFromDate}
                onChange={(e) => setEventFromDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={eventToDate}
                onChange={(e) => setEventToDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Applies To
              </label>
              <select
                value={eventScopeType}
                onChange={(e) => setEventScopeType(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="global">All Courses</option>
                <option value="course">Selected Course</option>
                <option value="courseYear">Selected Course + Year</option>
                <option value="student">Selected Students</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="holiday">Holiday</option>
                <option value="internship">Internship</option>
                <option value="event">Other Event</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Event Course
              </label>
              <select
                value={eventCourse}
                onChange={(e) => setEventCourse(e.target.value)}
                disabled={eventScopeType === "global"}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Select Course</option>
                {COURSE_OPTIONS.map((courseOption) => (
                  <option key={courseOption} value={courseOption}>
                    {courseOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Event Year
              </label>
              <select
                value={eventYear}
                onChange={(e) => setEventYear(e.target.value)}
                disabled={
                  eventScopeType !== "courseYear" &&
                  eventScopeType !== "student"
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Select Year</option>
                {YEAR_OPTIONS.map((yearOption) => (
                  <option key={yearOption.value} value={yearOption.value}>
                    {yearOption.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 rounded-xl border border-amber-100 bg-white/80 px-4 py-3 text-sm text-gray-700">
              Preview date above checks which event affects the currently viewed
              attendance table. The range builder below creates a new event in one step.
            </div>
          </div>

          {eventScopeType === "student" && (
            <div className="mt-4 rounded-xl border border-amber-100 bg-white/85 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Select Students
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose the students who should get this event range for the
                    selected course and year.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEventStudentIds(
                        eventStudents.map((student) => student._id)
                      )
                    }
                    disabled={eventStudents.length === 0}
                    className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventStudentIds([])}
                    disabled={eventStudentIds.length === 0}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2 text-xs font-medium text-amber-800">
                Selected students: {eventStudentIds.length}
              </div>

              {eventStudentsLoading ? (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                  Loading students for event selection...
                </div>
              ) : eventStudentsError ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {eventStudentsError}
                </div>
              ) : !eventCourse || !eventYear ? (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                  Choose the event course and year first.
                </div>
              ) : eventStudents.length === 0 ? (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                  No students found for {eventCourse} year {eventYear}.
                </div>
              ) : (
                <div className="mt-4 grid max-h-72 grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                  {eventStudents.map((student) => {
                    const isChecked = eventStudentIds.includes(student._id);

                    return (
                      <label
                        key={`event-student-${student._id}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                          isChecked
                            ? "border-amber-300 bg-amber-50"
                            : "border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setEventStudentIds((prev) =>
                              isChecked
                                ? prev.filter((studentId) => studentId !== student._id)
                                : [...prev, student._id]
                            )
                          }
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {student.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {student.enrollmentNo || "No enrollment"} | Year{" "}
                            {student.year || "-"}
                          </p>
                          {student.activeEvent && (
                            <p className="mt-2 text-xs font-medium text-amber-800">
                              Active on {date}:{" "}
                              {student.activeEvent.title ||
                                getEventTypeLabel(student.activeEvent.eventType)}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveHoliday}
              disabled={!eventFromDate || !eventToDate || holidaySaving}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {holidaySaving ? "Saving Event..." : "Save Event Range"}
            </button>
            <button
              type="button"
              onClick={removeConfiguredHoliday}
              disabled={!eventFromDate || !eventToDate || holidaySaving}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {holidaySaving ? "Removing..." : "Remove This Range"}
            </button>
            <span className="text-xs text-gray-500">
              Use the same dates, scope, course, year, and students to delete a wrong event.
            </span>
            {holidayLoading && (
              <span className="text-sm font-medium text-gray-600">
                Checking event status...
              </span>
            )}
            {holidayInfo && (
              <span
                className={`rounded-full border px-3 py-1 text-sm font-medium ${getEventTypeClasses(
                  holidayInfo.eventType
                )}`}
              >
                Active on {holidayInfo.date || date}:{" "}
                {holidayInfo.title || getEventTypeLabel(holidayInfo.eventType)}
              </span>
            )}
            {holidayMessage && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                Saved
              </span>
            )}
            {holidayInfo && (
              <button
                type="button"
                onClick={removeHoliday}
                disabled={holidaySaving}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {holidaySaving ? "Removing..." : "Remove Active Event"}
              </button>
            )}
          </div>
        </div>

        {holidayMessage && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 shadow-sm">
            {holidayMessage}
          </div>
        )}

        {holidayError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {holidayError}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {holidayInfo && (
          <div className={`border-b px-6 py-4 ${getEventTypeClasses(holidayInfo.eventType)}`}>
            <p className="text-sm font-semibold">
              Event active on {holidayInfo.date || date} for{" "}
              {getAppliedEventLabel(holidayInfo)}
            </p>
            <p className="mt-1 text-sm">
              {getEventTypeLabel(holidayInfo.eventType)}:{" "}
              {holidayInfo.title || getEventTypeLabel(holidayInfo.eventType)}
              {holidayInfo.fromDate && holidayInfo.toDate
                ? ` | Range: ${holidayInfo.fromDate} to ${holidayInfo.toDate}`
                : ""}
            </p>
          </div>
        )}
        {loading ? (
          <p className="p-6 text-sm font-medium text-gray-700">
            Loading attendance...
          </p>
        ) : error ? (
          <p className="p-6 text-sm font-medium text-red-700">{error}</p>
        ) : attendance.length === 0 ? (
          <p className="p-6 text-sm font-medium text-gray-700">
            No attendance found.
          </p>
        ) : (
          <div className="space-y-6 p-6">
            {attendance.map((item) => (
              <div
                key={item._id}
                className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm"
              >
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                  <p className="text-base font-semibold text-gray-950">
                    {item.course} | Year {item.year} | {item.date}
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    Marked by: {item.markedBy?.name || "Unknown"}
                  </p>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">
                        Enrollment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.records.map((record, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {record.studentId?.enrollmentNo || "-"}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-950">
                          <button
                            type="button"
                            onClick={() => openStudentSummary(record.studentId?._id)}
                            className="text-left text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            {record.studentId?.name || "-"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {record.studentId?.email || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex min-w-20 justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                              record.status === "present"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
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
