"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const COURSE_MAP = {
  BPT: "Bachelor of Physiotherapy",
  BOPTOM: "Bachelor of Optometry",
  BMRIT: "Medical Radiology & Imaging",
  DOPTOM: "Diploma in Optometry",
  BOTT: "Operation Theater Technology",
};

const ATTENDANCE_START_DATE = "2026-01-01";
const ATTENDANCE_START_MONTH = "2026-01";
const WINTER_VACATION_FROM = "2026-01-01";
const WINTER_VACATION_TO = "2026-01-18";
const COLLEGE_RESUME_DATE = "2026-01-19";
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

function isSunday(dateString) {
  return new Date(`${dateString}T00:00:00`).getDay() === 0;
}

function getDateValidationMessage(dateString) {
  const todayISO = getTodayISO();

  if (!dateString) return "Select a valid attendance date.";
  if (dateString < ATTENDANCE_START_DATE) {
    return "Attendance cannot be marked before January 1, 2026.";
  }
  if (dateString >= WINTER_VACATION_FROM && dateString <= WINTER_VACATION_TO) {
    return "Winter vacation runs from January 1, 2026 to January 18, 2026.";
  }
  if (isSunday(dateString)) {
    return "Sundays are holidays and attendance cannot be marked.";
  }
  if (dateString > todayISO) {
    return "Future attendance dates are not allowed.";
  }
  return "";
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
    return `${course} Year ${year} (${studentCount} selected student${studentCount === 1 ? "" : "s"})`;
  }

  if (scopeType === "courseYear") {
    return `${course} Year ${year}`;
  }

  return `${course} (all years)`;
}

function getAppliedEventLabel(eventInfo) {
  if (!eventInfo) return "";
  return getScopeLabel(
    eventInfo.scopeType,
    eventInfo.course,
    eventInfo.year,
    eventInfo.scopeType === "student" ? 1 : 0
  );
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

function getBuilderScopeLabel(scopeType) {
  if (scopeType === "student") return "Only Selected Students";
  if (scopeType === "course") return "Whole Course (All Years)";
  return "One Year of This Course";
}

function getBuilderScopeHelpText(scopeType, course, year, studentCount = 0) {
  const courseLabel = course || "this course";
  const classLabel =
    course && year
      ? `${course} year ${year}`
      : course
      ? `${course} for the selected year`
      : year
      ? `the selected course year ${year}`
      : "the selected course and year";

  if (scopeType === "student") {
    if (studentCount > 0) {
      return `Only the ${studentCount} selected student${studentCount === 1 ? "" : "s"} in ${classLabel} will get this range.`;
    }

    return `Choose the exact students in ${classLabel} who should get this range.`;
  }

  if (scopeType === "course") {
    return `Every student in ${courseLabel}, across all years, will get this same range.`;
  }

  return `Every student in ${classLabel} will get this same range.`;
}

function getBuilderEventTypeHelpText(eventType) {
  if (eventType === "internship") {
    return "Use this when students are on internship instead of normal class attendance.";
  }

  if (eventType === "event") {
    return "Use this for workshops, training, camps, seminars, or any non-holiday activity.";
  }

  return "Use this for college off, leave, public holidays, or any day that should count as a holiday.";
}

function createUnmarkedAttendance(students) {
  const initial = {};
  students.forEach((student) => {
    initial[student._id] = "not_marked";
  });
  return initial;
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-3 py-3 md:items-center md:px-4 md:py-6">
      <div className="max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl md:max-h-[92vh]">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6 md:py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
              Student Attendance Overview
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              {summary?.student?.name || "Loading..."} | {summary?.student?.course || "-"} |
              {" "}Year {summary?.student?.year || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-end rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 sm:self-auto"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-4 md:space-y-6 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <p className="text-sm leading-6 text-gray-600">
              Attendance rules exclude winter vacation and Sundays from working days.
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
              Loading student attendance...
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
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
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

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
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
                            <span className="text-sm font-bold text-indigo-700">
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

export default function MarkAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const course = String(params.course || "").toUpperCase();
  const courseName = COURSE_MAP[course];

  const [me, setMe] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [selectedYear, setSelectedYear] = useState("1");
  const [eventFromDate, setEventFromDate] = useState(getTodayISO());
  const [eventToDate, setEventToDate] = useState(getTodayISO());
  const [eventScopeType, setEventScopeType] = useState("courseYear");
  const [eventType, setEventType] = useState("holiday");
  const [eventYear, setEventYear] = useState("1");
  const [eventStudentIds, setEventStudentIds] = useState([]);
  const [eventStudents, setEventStudents] = useState([]);
  const [eventStudentsLoading, setEventStudentsLoading] = useState(false);
  const [eventStudentsError, setEventStudentsError] = useState("");
  const [studentsReloadToken, setStudentsReloadToken] = useState(0);
  const [eventStudentsReloadToken, setEventStudentsReloadToken] = useState(0);

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  const [attendance, setAttendance] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [holidayTitle, setHolidayTitle] = useState("");
  const [holidayInfo, setHolidayInfo] = useState(null);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [holidayMessage, setHolidayMessage] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSummary, setStudentSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryMonthKey, setSummaryMonthKey] = useState(getCurrentMonthKey());

  const dateValidationMessage = useMemo(
    () => getDateValidationMessage(selectedDate),
    [selectedDate]
  );
  const holidayBlockMessage = holidayInfo
    ? `This date is blocked by ${getAppliedEventLabel(holidayInfo)}: ${holidayInfo.title || getEventTypeLabel(holidayInfo.eventType)}`
    : "";
  const actionBlockMessage = dateValidationMessage || holidayBlockMessage;
  const markableStudents = useMemo(
    () => students.filter((student) => !student.activeEvent),
    [students]
  );
  const blockedStudents = useMemo(
    () => students.filter((student) => student.activeEvent),
    [students]
  );
  const blockedStudentIds = useMemo(
    () => new Set(blockedStudents.map((student) => student._id)),
    [blockedStudents]
  );

  useEffect(() => {
    const run = async () => {
      setPageError("");

      if (!courseName) {
        setPageLoading(false);
        setPageError("Invalid course route");
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
          router.replace(`/dashboard/faculty/${user.assignedCourse}/attendance`);
          return;
        }
      } catch (e) {
        setPageError("Failed to load attendance page");
      } finally {
        setPageLoading(false);
      }
    };

    run();
  }, [course, courseName, router]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!courseName || pageLoading || !me || !selectedYear || !selectedDate) return;

      setStudentsLoading(true);
      setStudentsError("");
      setSubmitMessage("");
      setSubmitError("");

      try {
        const res = await fetch(
          `/api/faculty/students?course=${course}&year=${selectedYear}&date=${selectedDate}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || `Failed (HTTP ${res.status})`);
        }

        if (!Array.isArray(data)) {
          throw new Error("Students API did not return an array");
        }

        setStudents(data);
        const initialAttendance = createUnmarkedAttendance(data);

        try {
          const attendanceRes = await fetch(
            `/api/faculty/attendance?course=${course}&year=${selectedYear}&date=${selectedDate}`,
            {
              credentials: "include",
              cache: "no-store",
            }
          );

          const attendanceData = await attendanceRes.json().catch(() => null);

          if (attendanceRes.ok && attendanceData?.records?.length) {
            const mappedAttendance = { ...initialAttendance };

            attendanceData.records.forEach((record) => {
              mappedAttendance[String(record.studentId)] = record.status;
            });

            setAttendance(mappedAttendance);
            setSubmitMessage("Saved attendance loaded for the selected date");
          } else {
            setAttendance(initialAttendance);
          }
        } catch {
          setAttendance(initialAttendance);
        }
      } catch (e) {
        setStudents([]);
        setAttendance({});
        setStudentsError(e.message || "Failed to load students");
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, [course, courseName, pageLoading, me, selectedYear, selectedDate, studentsReloadToken]);

  useEffect(() => {
    if (eventScopeType !== "student") {
      setEventStudents([]);
      setEventStudentsLoading(false);
      setEventStudentsError("");
      return;
    }

    if (!courseName || pageLoading || !me || !eventYear) return;

    let cancelled = false;

    const loadEventStudents = async () => {
      try {
        setEventStudentsLoading(true);
        setEventStudentsError("");

        const res = await fetch(
          `/api/faculty/students?course=${course}&year=${eventYear}&date=${selectedDate}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

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
      } catch (error) {
        if (!cancelled) {
          setEventStudents([]);
          setEventStudentsError(error.message || "Failed to load students");
        }
      } finally {
        if (!cancelled) {
          setEventStudentsLoading(false);
        }
      }
    };

    loadEventStudents();

    return () => {
      cancelled = true;
    };
  }, [
    course,
    courseName,
    eventScopeType,
    eventYear,
    me,
    pageLoading,
    selectedDate,
    eventStudentsReloadToken,
  ]);

  const fetchHolidayInfo = useCallback(async (nextDate = selectedDate, nextYear = selectedYear) => {
    if (!course || !nextYear || !nextDate || pageLoading || !me) {
      setHolidayInfo(null);
      return;
    }

    try {
      setHolidayLoading(true);
      setHolidayMessage("");
      setSubmitError("");

      const params = new URLSearchParams({
        date: nextDate,
        course,
        year: nextYear,
      });

      const res = await fetch(`/api/faculty/holidays?${params.toString()}`, {
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
    } catch (error) {
      setHolidayInfo(null);
      setSubmitError(error.message || "Failed to load holiday");
    } finally {
      setHolidayLoading(false);
    }
  }, [course, me, pageLoading, selectedDate, selectedYear]);

  useEffect(() => {
    fetchHolidayInfo();
  }, [fetchHolidayInfo]);

  const toggleAttendance = (studentId) => {
    if (blockedStudentIds.has(studentId)) return;

    setAttendance((prev) => ({
      ...prev,
      [studentId]:
        prev[studentId] === "not_marked"
          ? "present"
          : prev[studentId] === "present"
          ? "absent"
          : "not_marked",
    }));
  };

  const markAllPresent = () => {
    setAttendance((prev) => {
      const next = { ...prev };
      markableStudents.forEach((student) => {
        next[student._id] = "present";
      });
      return next;
    });
  };

  const markAllAbsent = () => {
    setAttendance((prev) => {
      const next = { ...prev };
      markableStudents.forEach((student) => {
        next[student._id] = "absent";
      });
      return next;
    });
  };

  const presentCount = useMemo(
    () =>
      markableStudents.filter(
        (student) => attendance[student._id] === "present"
      ).length,
    [attendance, markableStudents]
  );

  const absentCount = useMemo(
    () =>
      markableStudents.filter(
        (student) => attendance[student._id] === "absent"
      ).length,
    [attendance, markableStudents]
  );

  const notMarkedCount = useMemo(
    () =>
      markableStudents.filter((student) => {
        const status = attendance[student._id] || "not_marked";
        return status === "not_marked";
      }).length,
    [attendance, markableStudents]
  );

  const handleSubmit = async () => {
    if (actionBlockMessage) {
      setSubmitError(actionBlockMessage);
      return;
    }

    if (markableStudents.length === 0) {
      setSubmitError(
        `All students in ${course} year ${selectedYear} already have an active event on ${selectedDate}.`
      );
      return;
    }

    if (notMarkedCount > 0) {
      setSubmitError(
        "Some students are still marked as Not Marked. Please mark all students before submitting attendance."
      );
      return;
    }

    setSubmitLoading(true);
    setSubmitMessage("");
    setSubmitError("");

    try {
      const payload = {
        course,
        year: Number(selectedYear),
        date: selectedDate,
        records: markableStudents.map((student) => ({
          studentId: student._id,
          status: attendance[student._id] || "absent",
        })),
      };

      const res = await fetch("/api/faculty/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to save attendance");
      }

      setSubmitMessage("Attendance saved successfully");
    } catch (error) {
      setSubmitError(error.message || "Failed to save attendance");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleMarkHoliday = async () => {
    if (!eventFromDate || !eventToDate) {
      setSubmitError("Select a start date and end date for the event.");
      return;
    }

    if ((eventScopeType === "courseYear" || eventScopeType === "student") && !eventYear) {
      setSubmitError("Select the year for this event.");
      return;
    }

    if (eventScopeType === "student" && eventStudentIds.length === 0) {
      setSubmitError("Select at least one student for this event.");
      return;
    }

    try {
      setHolidaySaving(true);
      setHolidayMessage("");
      setSubmitError("");
      setSubmitMessage("");

      const res = await fetch("/api/faculty/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fromDate: eventFromDate,
          toDate: eventToDate,
          title: holidayTitle.trim() || "Holiday",
          eventType,
          scopeType: eventScopeType,
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
      setHolidayMessage(data.message || "Holiday saved successfully");
      setStudentsReloadToken((value) => value + 1);
      setEventStudentsReloadToken((value) => value + 1);
      if (eventScopeType !== "student") {
        await fetchHolidayInfo();
      }
    } catch (error) {
      setSubmitError(error.message || "Failed to save holiday");
    } finally {
      setHolidaySaving(false);
    }
  };

  const removeConfiguredHoliday = async () => {
    if (!eventFromDate || !eventToDate) {
      setSubmitError("Select a start date and end date for the event.");
      return;
    }

    if ((eventScopeType === "courseYear" || eventScopeType === "student") && !eventYear) {
      setSubmitError("Select the year for this event.");
      return;
    }

    if (eventScopeType === "student" && eventStudentIds.length === 0) {
      setSubmitError("Select at least one student for this event.");
      return;
    }

    try {
      setHolidaySaving(true);
      setHolidayMessage("");
      setSubmitError("");
      setSubmitMessage("");

      const res = await fetch("/api/faculty/holidays", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fromDate: eventFromDate,
          toDate: eventToDate,
          scopeType: eventScopeType,
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
      setStudentsReloadToken((value) => value + 1);
      setEventStudentsReloadToken((value) => value + 1);
      if (eventScopeType !== "student") {
        await fetchHolidayInfo();
      }
    } catch (error) {
      setSubmitError(error.message || "Failed to remove event");
    } finally {
      setHolidaySaving(false);
    }
  };

  const removeHoliday = async () => {
    if (!holidayInfo) return;

    try {
      setHolidaySaving(true);
      setHolidayMessage("");
      setSubmitError("");

      const res = await fetch("/api/faculty/holidays", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fromDate: holidayInfo.fromDate || holidayInfo.date,
          toDate: holidayInfo.toDate || holidayInfo.date,
          scopeType: holidayInfo.scopeType || "course",
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
      setStudentsReloadToken((value) => value + 1);
      setEventStudentsReloadToken((value) => value + 1);
      if (holidayInfo.scopeType !== "student") {
        await fetchHolidayInfo();
      }
    } catch (error) {
      setSubmitError(error.message || "Failed to remove event");
    } finally {
      setHolidaySaving(false);
    }
  };

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
    } catch (error) {
      setSummaryError(error.message || "Failed to load student attendance");
    } finally {
      setSummaryLoading(false);
    }
  }

  if (pageLoading) return <div className="p-6">Loading...</div>;

  if (pageError) {
    return (
      <div className="p-6">
        <p className="text-red-600">{pageError}</p>
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
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mark Attendance
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {course} · {courseName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Faculty: {me?.name || "-"}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/dashboard/faculty/${course}`}
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Attendance Policy
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Attendance starts from January 1, 2026. Winter vacation runs from
            January 1, 2026 to January 18, 2026. College resumes on January 19,
            2026, Sundays are treated as holidays, and custom events can be
            applied to your full course or a selected year.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <input
                value={`${course} - ${courseName}`}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-slate-100 text-slate-900 font-medium opacity-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {YEAR_OPTIONS.map((yearOption) => (
                  <option key={yearOption.value} value={yearOption.value}>
                    {yearOption.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                min={COLLEGE_RESUME_DATE}
                max={getTodayISO()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                Sundays and winter vacation dates are blocked.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Actions
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={markAllPresent}
                  disabled={
                    studentsLoading ||
                    students.length === 0 ||
                    markableStudents.length === 0 ||
                    !!actionBlockMessage
                  }
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={markAllAbsent}
                  disabled={
                    studentsLoading ||
                    students.length === 0 ||
                    markableStudents.length === 0 ||
                    !!actionBlockMessage
                  }
                  className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  All Absent
                </button>
              </div>
            </div>
          </div>

          {actionBlockMessage && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {actionBlockMessage}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Event Builder
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  Mark Event / Holiday Range
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  Save internship days, department leave, workshops, or college
                  off in one step. Faculty can apply the event to the whole course,
                  one selected year, or only selected students in that year.
                </p>
              </div>

              {holidayLoading && (
                <span className="text-sm font-medium text-gray-600">
                  Checking event status...
                </span>
              )}
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
                  placeholder="Internship, workshop, department off..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  <option value="courseYear">One Year of This Course</option>
                  <option value="course">Whole Course (All Years)</option>
                  <option value="student">Only Selected Students</option>
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
                  <option value="holiday">Holiday / Leave</option>
                  <option value="internship">Internship</option>
                  <option value="event">Other Event / Workshop</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Event Course
                </label>
                <input
                  value={`${course} - ${courseName}`}
                  disabled
                  className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-medium text-gray-900"
                />
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
                  {YEAR_OPTIONS.map((yearOption) => (
                    <option key={yearOption.value} value={yearOption.value}>
                      {yearOption.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 rounded-xl border border-amber-100 bg-white/80 px-4 py-3 text-sm text-gray-700">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                  Builder Guide
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-gray-900">Applies To:</span>{" "}
                  {getBuilderScopeLabel(eventScopeType)}.{" "}
                  {getBuilderScopeHelpText(
                    eventScopeType,
                    course,
                    eventYear,
                    eventStudentIds.length
                  )}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-gray-900">Event Type:</span>{" "}
                  {getEventTypeLabel(eventType)}. {getBuilderEventTypeHelpText(eventType)}
                </p>
                <p className="mt-2">
                  The attendance date above is only for previewing and marking class
                  attendance. This event builder saves a separate date range for your
                  course schedule.
                </p>
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
                      Pick the students who should get this internship or event
                      range. You can save one group now and another group on
                      different dates.
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
                ) : eventStudents.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                    No students found for year {eventYear}.
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
                                Active on {selectedDate}:{" "}
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
                onClick={handleMarkHoliday}
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
                Use the same dates, scope, year, and students to delete a wrong event.
              </span>

              {holidayInfo && (
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-medium ${getEventTypeClasses(
                    holidayInfo.eventType
                  )}`}
                >
                  Active on {holidayInfo.date || selectedDate}:{" "}
                  {holidayInfo.title || getEventTypeLabel(holidayInfo.eventType)}
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
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {holidayMessage && (
            <div className="border-b border-green-200 bg-green-50 px-6 py-4 text-sm font-medium text-green-700">
              {holidayMessage}
            </div>
          )}

          {holidayInfo && (
            <div className={`border-b px-6 py-4 ${getEventTypeClasses(holidayInfo.eventType)}`}>
              <p className="text-sm font-semibold">
                Event active on {holidayInfo.date || selectedDate} for{" "}
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

          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Student List
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Only students enrolled in {course}, year {selectedYear} are shown.
            </p>
          </div>

          {blockedStudents.length > 0 && (
            <div className="border-b border-cyan-200 bg-cyan-50 px-6 py-4 text-sm font-medium text-cyan-800">
              {blockedStudents.length} student
              {blockedStudents.length === 1 ? "" : "s"} already have an active
              event on {selectedDate}. Those students are excluded from attendance
              submission for this date.
            </div>
          )}

          {studentsLoading ? (
            <div className="p-6 text-sm text-gray-600">Loading students...</div>
          ) : studentsError ? (
            <div className="p-6 text-sm text-red-600">{studentsError}</div>
          ) : students.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              No students found for {course} year {selectedYear}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                      Enrollment
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                      Student Name
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                      Year
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => {
                    const status = attendance[student._id] || "not_marked";
                    const activeEvent = student.activeEvent;

                    return (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">
                          {student.enrollmentNo || "-"}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {(student.name || "S").charAt(0)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => openStudentSummary(student._id)}
                              className="text-sm text-gray-900 hover:text-indigo-700 hover:underline"
                            >
                              {student.name}
                            </button>
                          </div>
                          {activeEvent && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getEventTypeClasses(
                                  activeEvent.eventType
                                )}`}
                              >
                                {getEventTypeLabel(activeEvent.eventType)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {activeEvent.title ||
                                  getEventTypeLabel(activeEvent.eventType)}
                                {activeEvent.fromDate && activeEvent.toDate
                                  ? ` | ${activeEvent.fromDate} to ${activeEvent.toDate}`
                                  : ""}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6 text-sm text-gray-700">
                          {student.year || "-"}
                        </td>

                        <td className="py-4 px-6 text-center">
                          {activeEvent ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getEventTypeClasses(
                                  activeEvent.eventType
                                )}`}
                              >
                                {getEventTypeLabel(activeEvent.eventType)}
                              </span>
                              <span className="text-xs text-gray-500">
                                Attendance skipped
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleAttendance(student._id)}
                              disabled={!!actionBlockMessage}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition disabled:opacity-50 ${
                                status === "present"
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : status === "absent"
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {status === "present"
                                ? "Present"
                                : status === "absent"
                                ? "Absent"
                                : "Not Marked"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Present:{" "}
              <span className="font-semibold text-green-600">{presentCount}</span>
              {" "} | Absent:{" "}
              <span className="font-semibold text-red-600">{absentCount}</span>
              {" "} | Event:{" "}
              <span className="font-semibold text-cyan-700">
                {blockedStudents.length}
              </span>
              {" "} | Not Marked:{" "}
              <span className="font-semibold text-slate-700">{notMarkedCount}</span>
              {" "} | Total: {students.length}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                studentsLoading ||
                students.length === 0 ||
                markableStudents.length === 0 ||
                submitLoading ||
                !!actionBlockMessage
              }
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitLoading ? "Saving..." : "Submit Attendance"}
            </button>
          </div>
        </div>

        {submitMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {submitMessage}
          </div>
        )}

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {submitError}
          </div>
        )}

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
    </div>
  );
}
