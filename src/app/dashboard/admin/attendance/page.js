"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AttendancePerformanceChart from "../../_components/AttendancePerformanceChart";

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

function formatSelectionLabel(values, emptyLabel) {
  if (!Array.isArray(values) || values.length === 0) return emptyLabel;
  if (values.length <= 3) return values.join(", ");
  return `${values.slice(0, 3).join(", ")} +${values.length - 3} more`;
}

function getScopeLabel(
  scopeType,
  course,
  year,
  studentCount = 0,
  courses = [],
  years = []
) {
  if (scopeType === "student") {
    if (course && year) {
      return `${course} Year ${year} (${studentCount} selected student${studentCount === 1 ? "" : "s"})`;
    }
    return "selected students";
  }

  if (scopeType === "courseYear") {
    const courseLabel = formatSelectionLabel(
      courses.length ? courses : course ? [course] : [],
      "selected course"
    );
    const yearLabel = formatSelectionLabel(
      years.length ? years.map(String) : year ? [String(year)] : [],
      "selected year"
    );
    return `${courseLabel} | Year${(years.length ? years : year ? [year] : []).length === 1 ? "" : "s"} ${yearLabel}`;
  }

  if (scopeType === "course") {
    return `${formatSelectionLabel(
      courses.length ? courses : course ? [course] : [],
      "selected course"
    )} (all years)`;
  }

  return "all courses";
}

function getAppliedEventLabel(eventInfo) {
  if (!eventInfo) return "";
  return getScopeLabel(
    eventInfo.scopeType,
    eventInfo.course,
    eventInfo.year,
    eventInfo.scopeType === "student" ? 1 : 0,
    eventInfo.courses || [],
    eventInfo.years || []
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

function getApprovalStatusLabel(status) {
  if (status === "denied") return "Denied";
  if (status === "pending") return "Pending Approval";
  return "Approved";
}

function getApprovalStatusClasses(status) {
  if (status === "denied") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-green-200 bg-green-50 text-green-800";
}

function getBuilderScopeLabel(scopeType) {
  if (scopeType === "student") return "Only Selected Students";
  if (scopeType === "courseYear") return "One Year of Selected Course";
  if (scopeType === "course") return "Whole Selected Course (All Years)";
  return "All Courses and Years";
}

function getBuilderScopeHelpText(scopeType, course, year, studentCount = 0) {
  const courseLabel = course || "the selected course";
  const classLabel =
    course && year
      ? `${course} year ${year}`
      : course
      ? `${course} for the selected year`
      : year
      ? `the selected course year ${year}`
      : "the selected course and year";

  if (scopeType === "global") {
    return "Every student in every course and every year will get this same range.";
  }

  if (scopeType === "student") {
    if (studentCount > 0) {
      return `Only the ${studentCount} selected student${studentCount === 1 ? "" : "s"} in ${classLabel} will get this range.`;
    }

    if (course && year) {
      return `Choose the exact students in ${classLabel} who should get this range.`;
    }

    return "Choose the course and year first, then pick the exact students who should get this range.";
  }

  if (scopeType === "course") {
    if (course) {
      return `Every student in ${courseLabel}, across all years, will get this same range.`;
    }

    return "Choose a course first. Everyone in that course, across all years, will get this same range.";
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

function getAdminBuilderPreset(scopeType, eventType) {
  if (scopeType === "global" && eventType === "holiday") {
    return "globalHoliday";
  }

  if (scopeType === "course" && eventType === "holiday") {
    return "courseHoliday";
  }

  if (scopeType === "courseYear" && eventType === "holiday") {
    return "yearHoliday";
  }

  if (scopeType === "student" && eventType === "internship") {
    return "studentInternship";
  }

  if (scopeType === "student" && eventType === "event") {
    return "studentEvent";
  }

  return "custom";
}

function getRecentEventKey(eventInfo) {
  const courses = Array.isArray(eventInfo?.courses)
    ? [...eventInfo.courses].map(String).sort()
    : [];
  const years = Array.isArray(eventInfo?.years)
    ? [...eventInfo.years].map(String).sort()
    : [];
  const studentIds = Array.isArray(eventInfo?.studentIds)
    ? [...eventInfo.studentIds].map(String).sort()
    : [];

  return [
    eventInfo?.batchId || "",
    eventInfo?.fromDate || "",
    eventInfo?.toDate || "",
    eventInfo?.title || "",
    eventInfo?.eventType || "",
    eventInfo?.scopeType || "",
    eventInfo?.course || "",
    eventInfo?.year ?? "",
    courses.join(","),
    years.join(","),
    studentIds.join(","),
  ].join("|");
}

function formatEventRange(fromDate, toDate) {
  if (!fromDate) return "-";
  if (!toDate || toDate === fromDate) return fromDate;
  return `${fromDate} to ${toDate}`;
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-3 py-3 md:items-center md:px-4 md:py-6">
      <div className="max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl md:max-h-[92vh]">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6 md:py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
              Student Attendance Summary
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
            X
          </button>
        </div>

        <div className="space-y-5 p-4 md:space-y-6 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm leading-6 text-gray-600">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

              <AttendancePerformanceChart
                months={summary?.months || []}
                selectedMonthKey={monthKey}
                title="Student Performance Graph"
                subtitle="Track this student's attendance performance across months before reviewing the detailed calendar."
              />

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
  return <AdminAttendancePageContent />;
}

export function AdminAttendancePageContent({
  initialStatus = "",
  pageTitle = "Attendance",
  pageDescription = "View attendance of all students across all courses",
  lockStatusFilter = false,
}) {
  const [attendance, setAttendance] = useState([]);
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState(getTodayISO());
  const [approvalStatus, setApprovalStatus] = useState(initialStatus);
  const [eventFromDate, setEventFromDate] = useState(getTodayISO());
  const [eventToDate, setEventToDate] = useState(getTodayISO());
  const [eventScopeType, setEventScopeType] = useState("global");
  const [eventType, setEventType] = useState("holiday");
  const [eventCourses, setEventCourses] = useState([]);
  const [eventYears, setEventYears] = useState([]);
  const [eventStudentIds, setEventStudentIds] = useState([]);
  const [eventStudents, setEventStudents] = useState([]);
  const [eventStudentsLoading, setEventStudentsLoading] = useState(false);
  const [eventStudentsError, setEventStudentsError] = useState("");
  const [holidayTitle, setHolidayTitle] = useState("");
  const [holidayInfo, setHolidayInfo] = useState(null);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [holidayMessage, setHolidayMessage] = useState("");
  const [showEventBuilder, setShowEventBuilder] = useState(false);
  const [holidayError, setHolidayError] = useState("");
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentEventsLoading, setRecentEventsLoading] = useState(false);
  const [recentEventsError, setRecentEventsError] = useState("");
  const [editingRecentEvent, setEditingRecentEvent] = useState(null);
  const [recentEventActionKey, setRecentEventActionKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewLoadingId, setReviewLoadingId] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const eventBuilderPreset = getAdminBuilderPreset(eventScopeType, eventType);
  const eventCourse = eventCourses[0] || "";
  const eventYear = eventYears[0] || "";

  const toggleEventCourse = useCallback((courseOption) => {
    setEventCourses((prev) =>
      prev.includes(courseOption)
        ? prev.filter((item) => item !== courseOption)
        : [...prev, courseOption]
    );
  }, []);

  const toggleEventYear = useCallback((yearOption) => {
    setEventYears((prev) =>
      prev.includes(yearOption)
        ? prev.filter((item) => item !== yearOption)
        : [...prev, yearOption]
    );
  }, []);

  const handleEventBuilderPresetChange = (preset) => {
    if (preset === "custom") return;

    if (preset === "globalHoliday") {
      setEventScopeType("global");
      setEventType("holiday");
      setEventStudentIds([]);
      setEventCourses([]);
      setEventYears([]);
      return;
    }

    if (preset === "courseHoliday") {
      setEventScopeType("course");
      setEventType("holiday");
      setEventStudentIds([]);
      if (!eventCourses.length && course) {
        setEventCourses([course]);
      }
      setEventYears([]);
      return;
    }

    if (preset === "yearHoliday") {
      setEventScopeType("courseYear");
      setEventType("holiday");
      setEventStudentIds([]);
      if (!eventCourses.length && course) {
        setEventCourses([course]);
      }
      if (!eventYears.length && year) {
        setEventYears([year]);
      }
      return;
    }

    if (preset === "studentInternship") {
      setEventScopeType("student");
      setEventType("internship");
      if (!eventCourses.length && course) {
        setEventCourses([course]);
      }
      if (!eventYears.length && year) {
        setEventYears([year]);
      }
      return;
    }

    if (preset === "studentEvent") {
      setEventScopeType("student");
      setEventType("event");
      if (!eventCourses.length && course) {
        setEventCourses([course]);
      }
      if (!eventYears.length && year) {
        setEventYears([year]);
      }
    }
  };

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
    setApprovalStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (eventScopeType === "global") {
      if (eventCourses.length) setEventCourses([]);
      if (eventYears.length) setEventYears([]);
      if (eventStudentIds.length) setEventStudentIds([]);
      return;
    }

    if (eventScopeType === "course") {
      if (eventYears.length) setEventYears([]);
      if (eventStudentIds.length) setEventStudentIds([]);
      return;
    }

    if (eventScopeType === "courseYear") {
      if (eventStudentIds.length) setEventStudentIds([]);
      return;
    }

    if (eventScopeType === "student") {
      if (eventCourses.length > 1) {
        setEventCourses((prev) => prev.slice(0, 1));
      }
      if (eventYears.length > 1) {
        setEventYears((prev) => prev.slice(0, 1));
      }
    }
  }, [eventCourses.length, eventScopeType, eventStudentIds.length, eventYears.length]);

  const reviewAttendance = useCallback(async (attendanceId, decision) => {
    try {
      setReviewLoadingId(attendanceId);
      setReviewMessage("");
      setReviewError("");

      const res = await fetch("/api/admin/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ attendanceId, decision }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to review attendance");
      }

      setAttendance((prev) =>
        prev.map((item) => (item._id === attendanceId ? data.attendance : item)),
      );
      setReviewMessage(
        data.message ||
          (decision === "approve"
            ? "Attendance approved successfully"
            : "Attendance denied successfully"),
      );
    } catch (err) {
      setReviewError(err.message || "Failed to review attendance");
    } finally {
      setReviewLoadingId("");
    }
  }, []);

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
      if (approvalStatus) params.append("status", approvalStatus);

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
  }, [approvalStatus, course, date, year]);

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

  const fetchRecentEvents = useCallback(async () => {
    try {
      setRecentEventsLoading(true);
      setRecentEventsError("");

      const res = await fetch("/api/admin/holidays?view=recent&limit=8", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load recent events");
      }

      setRecentEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setRecentEvents([]);
      setRecentEventsError(err.message || "Failed to load recent events");
    } finally {
      setRecentEventsLoading(false);
    }
  }, []);

  async function saveHoliday() {
    if (!eventFromDate || !eventToDate) {
      setHolidayError("Choose a start date and end date for the event.");
      return;
    }

    if (eventScopeType !== "global" && eventCourses.length === 0) {
      setHolidayError("Choose at least one course for the selected event scope.");
      return;
    }

    if ((eventScopeType === "courseYear" || eventScopeType === "student") && eventYears.length === 0) {
      setHolidayError("Choose at least one year for the selected event scope.");
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
          courses: eventCourses,
          year:
            eventScopeType === "courseYear" || eventScopeType === "student"
              ? Number(eventYear)
              : undefined,
          years:
            eventScopeType === "courseYear" || eventScopeType === "student"
              ? eventYears.map(Number)
              : undefined,
          studentIds:
            eventScopeType === "student" ? eventStudentIds : undefined,
          replaceExisting: editingRecentEvent
            ? {
                batchId: editingRecentEvent.batchId,
                fromDate: editingRecentEvent.fromDate,
                toDate: editingRecentEvent.toDate,
                scopeType: editingRecentEvent.scopeType,
                course: editingRecentEvent.course || "",
                courses: editingRecentEvent.courses || [],
                year: editingRecentEvent.year ?? undefined,
                years: editingRecentEvent.years || [],
                studentIds:
                  editingRecentEvent.scopeType === "student"
                    ? editingRecentEvent.studentIds || []
                    : undefined,
              }
            : undefined,
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
          eventStudentIds.length,
          eventCourses,
          eventYears
        )} from ${eventFromDate} to ${eventToDate}`;
      setHolidayMessage(successMessage);
      setEditingRecentEvent(null);
      if (eventScopeType !== "student") {
        await fetchHolidayInfo(date);
      }
      fetchAttendance();
      fetchRecentEvents();
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

    if (eventScopeType !== "global" && eventCourses.length === 0) {
      setHolidayError("Choose at least one course for the selected event scope.");
      return;
    }

    if ((eventScopeType === "courseYear" || eventScopeType === "student") && eventYears.length === 0) {
      setHolidayError("Choose at least one year for the selected event scope.");
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
          batchId: editingRecentEvent?.batchId,
          scopeType: eventScopeType,
          course: eventCourse,
          courses: eventCourses,
          year:
            eventScopeType === "courseYear" || eventScopeType === "student"
              ? Number(eventYear)
              : undefined,
          years:
            eventScopeType === "courseYear" || eventScopeType === "student"
              ? eventYears.map(Number)
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
      setEditingRecentEvent(null);
      if (eventScopeType !== "student") {
        await fetchHolidayInfo(date);
      }
      fetchAttendance();
      fetchRecentEvents();
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

  useEffect(() => {
    fetchRecentEvents();
  }, [fetchRecentEvents]);

  function loadRecentEventIntoBuilder(eventInfo) {
    setShowEventBuilder(true);
    setEditingRecentEvent(eventInfo);
    setHolidayMessage("");
    setHolidayError("");
    setRecentEventsError("");
    setEventFromDate(eventInfo.fromDate || getTodayISO());
    setEventToDate(eventInfo.toDate || eventInfo.fromDate || getTodayISO());
    setEventScopeType(eventInfo.scopeType || "global");
    setEventType(eventInfo.eventType || "holiday");
    setEventCourses(
      Array.isArray(eventInfo.courses) && eventInfo.courses.length
        ? eventInfo.courses.map(String)
        : eventInfo.course
        ? [String(eventInfo.course)]
        : []
    );
    setEventYears(
      Array.isArray(eventInfo.years) && eventInfo.years.length
        ? eventInfo.years.map((value) => String(value))
        : eventInfo.year
        ? [String(eventInfo.year)]
        : []
    );
    setEventStudentIds(
      Array.isArray(eventInfo.studentIds)
        ? eventInfo.studentIds.map(String)
        : [],
    );
    setHolidayTitle(eventInfo.title || "");
  }

  function cancelRecentEventEditing() {
    setEditingRecentEvent(null);
  }

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
          batchId: holidayInfo.batchId,
          scopeType: holidayInfo.scopeType || "global",
          course: holidayInfo.course || "",
          courses: holidayInfo.courses || [],
          year: holidayInfo.year ?? undefined,
          years: holidayInfo.years || [],
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
      fetchRecentEvents();
    } catch (err) {
      setHolidayError(err.message || "Failed to remove event");
    } finally {
      setHolidaySaving(false);
    }
  }

  async function removeRecentEvent(eventInfo) {
    const eventKey = getRecentEventKey(eventInfo);

    try {
      setRecentEventActionKey(eventKey);
      setHolidayMessage("");
      setHolidayError("");

      const res = await fetch("/api/admin/holidays", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          batchId: eventInfo.batchId,
          fromDate: eventInfo.fromDate,
          toDate: eventInfo.toDate,
          scopeType: eventInfo.scopeType,
          course: eventInfo.course || "",
          courses: eventInfo.courses || [],
          year: eventInfo.year ?? undefined,
          years: eventInfo.years || [],
          studentIds:
            eventInfo.scopeType === "student" ? eventInfo.studentIds || [] : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to remove recent event");
      }

      if (editingRecentEvent && getRecentEventKey(editingRecentEvent) === eventKey) {
        setEditingRecentEvent(null);
      }

      setHolidayMessage(data.message || "Event removed successfully");
      fetchAttendance();
      fetchRecentEvents();
      await fetchHolidayInfo(date);
    } catch (err) {
      setHolidayError(err.message || "Failed to remove recent event");
    } finally {
      setRecentEventActionKey("");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-950">{pageTitle}</h1>
        <p className="text-sm font-medium text-gray-700">
          {pageDescription}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

          {lockStatusFilter ? (
            <div className="flex items-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
              Pending approval only
            </div>
          ) : (
            <select
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          )}

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

          <div className="mb-4 rounded-xl border border-sky-100 bg-white/90 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Recent Event Builder Activity
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Review the latest saved event ranges and reopen them with all options for editing.
                </p>
              </div>
              {recentEventsLoading ? (
                <span className="text-sm font-medium text-gray-500">
                  Loading recent events...
                </span>
              ) : null}
            </div>

            {recentEventsError ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {recentEventsError}
              </div>
            ) : null}

            {!recentEventsLoading && !recentEventsError && recentEvents.length === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-gray-600">
                No recent event builder entries found yet.
              </div>
            ) : null}

            {recentEvents.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                {recentEvents.map((recentEvent) => {
                  const eventKey = getRecentEventKey(recentEvent);
                  const isEditing = editingRecentEvent
                    ? getRecentEventKey(editingRecentEvent) === eventKey
                    : false;
                  const isBusy = recentEventActionKey === eventKey;

                  return (
                    <div
                      key={eventKey}
                      className={`rounded-xl border px-4 py-4 shadow-sm transition ${
                        isEditing
                          ? "border-amber-300 bg-amber-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-950">
                            {recentEvent.title || getEventTypeLabel(recentEvent.eventType)}
                          </p>
                          <p className="mt-1 text-xs font-medium text-gray-500">
                            Range: {formatEventRange(recentEvent.fromDate, recentEvent.toDate)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getEventTypeClasses(
                            recentEvent.eventType,
                          )}`}
                        >
                          {getEventTypeLabel(recentEvent.eventType)}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-gray-700">
                        <p>
                          <span className="font-semibold text-gray-900">Scope:</span>{" "}
                          {getScopeLabel(
                            recentEvent.scopeType,
                            recentEvent.course,
                            recentEvent.year ? String(recentEvent.year) : "",
                            recentEvent.studentCount || 0,
                            recentEvent.courses || [],
                            recentEvent.years || [],
                          )}
                        </p>
                        {recentEvent.latestUpdatedAt ? (
                          <p>
                            <span className="font-semibold text-gray-900">Last Updated:</span>{" "}
                            {new Date(recentEvent.latestUpdatedAt).toLocaleString()}
                          </p>
                        ) : null}
                        {recentEvent.scopeType === "student" ? (
                          <p>
                            <span className="font-semibold text-gray-900">Students:</span>{" "}
                            {recentEvent.studentCount}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => loadRecentEventIntoBuilder(recentEvent)}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                        >
                          {isEditing ? "Editing in Builder" : "Edit in Builder"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRecentEvent(recentEvent)}
                          disabled={isBusy}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {isBusy ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
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
            <button
              type="button"
              onClick={() => setShowEventBuilder((prev) => !prev)}
              aria-expanded={showEventBuilder}
              className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
            >
              {showEventBuilder ? "Hide Builder" : "Show Builder"}
            </button>
          </div>

          {showEventBuilder ? (
            <>
          {editingRecentEvent ? (
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-100/70 px-4 py-3 text-sm text-amber-950">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">
                    Editing recent event: {editingRecentEvent.title || getEventTypeLabel(editingRecentEvent.eventType)}
                  </p>
                  <p className="mt-1 text-xs">
                    Saving now will replace the old event range with these updated options.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cancelRecentEventEditing}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50"
                >
                  Cancel Edit Mode
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-xl border border-amber-100 bg-white/85 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quick Setup
            </label>
            <select
              value={eventBuilderPreset}
              onChange={(e) => handleEventBuilderPresetChange(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="globalHoliday">Holiday for All Courses</option>
              <option value="courseHoliday">Holiday for Whole Selected Course</option>
              <option value="yearHoliday">Holiday for One Year of Selected Course</option>
              <option value="studentInternship">Student-wise Internship</option>
              <option value="studentEvent">Student-wise Event / Workshop</option>
              <option value="custom">Custom Setup</option>
            </select>
            <p className="mt-2 text-xs text-gray-600">
              Pick the closest preset first. You can still adjust the course,
              year, dates, title, and students below.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
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
                <option value="global">All Courses and Years</option>
                <option value="course">Whole Selected Course (All Years)</option>
                <option value="courseYear">One Year of Selected Course</option>
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
              {eventScopeType === "student" ? (
                <select
                  value={eventCourse}
                  onChange={(e) =>
                    setEventCourses(e.target.value ? [e.target.value] : [])
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Course</option>
                  {COURSE_OPTIONS.map((courseOption) => (
                    <option key={courseOption} value={courseOption}>
                      {courseOption}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-gray-300 bg-white p-3">
                  {eventScopeType === "global" ? (
                    <p className="text-sm text-gray-500">All courses are already included.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {COURSE_OPTIONS.map((courseOption) => {
                        const isChecked = eventCourses.includes(courseOption);
                        return (
                          <label
                            key={courseOption}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              isChecked
                                ? "border-amber-300 bg-amber-50 text-amber-900"
                                : "border-gray-200 bg-white text-gray-700 hover:border-amber-200 hover:bg-amber-50/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleEventCourse(courseOption)}
                              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span>{courseOption}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Event Year
              </label>
              {eventScopeType === "student" ? (
                <select
                  value={eventYear}
                  onChange={(e) =>
                    setEventYears(e.target.value ? [e.target.value] : [])
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Year</option>
                  {YEAR_OPTIONS.map((yearOption) => (
                    <option key={yearOption.value} value={yearOption.value}>
                      {yearOption.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-gray-300 bg-white p-3">
                  {eventScopeType !== "courseYear" ? (
                    <p className="text-sm text-gray-500">
                      {eventScopeType === "global"
                        ? "All years are already included."
                        : "All years of the selected courses are included."}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {YEAR_OPTIONS.map((yearOption) => {
                        const isChecked = eventYears.includes(yearOption.value);
                        return (
                          <label
                            key={yearOption.value}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              isChecked
                                ? "border-amber-300 bg-amber-50 text-amber-900"
                                : "border-gray-200 bg-white text-gray-700 hover:border-amber-200 hover:bg-amber-50/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleEventYear(yearOption.value)}
                              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span>{yearOption.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
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
                  eventCourses.length > 1 ? formatSelectionLabel(eventCourses, "selected courses") : eventCourse,
                  eventYears.length > 1 ? formatSelectionLabel(eventYears, "selected years") : eventYear,
                  eventStudentIds.length
                )}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-gray-900">Event Type:</span>{" "}
                {getEventTypeLabel(eventType)}. {getBuilderEventTypeHelpText(eventType)}
              </p>
              <p className="mt-2">
                The preview date above only checks which event affects the
                currently viewed attendance table. This event builder saves a
                separate date range for the selected scope.
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
                            Year {student.year || "-"}
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
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-white/80 px-4 py-3 text-sm text-gray-700">
              Event builder is hidden. Click <span className="font-semibold text-amber-800">Show Builder</span> when you want to add, edit, or delete an event range.
            </div>
          )}
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

        {reviewMessage && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {reviewMessage}
          </div>
        )}

        {reviewError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {reviewError}
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
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-base font-semibold text-gray-950">
                        {item.course} | Year {item.year} | {item.date}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        Marked by: {item.markedBy?.name || "Unknown"}
                      </p>
                      {item.reviewedBy?.name ? (
                        <p className="mt-1 text-xs text-gray-600">
                          Reviewed by: {item.reviewedBy.name}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getApprovalStatusClasses(
                          item.approvalStatus,
                        )}`}
                      >
                        {getApprovalStatusLabel(item.approvalStatus)}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => reviewAttendance(item._id, "approve")}
                          disabled={reviewLoadingId === item._id}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {reviewLoadingId === item._id ? "Saving..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewAttendance(item._id, "deny")}
                          disabled={reviewLoadingId === item._id}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {reviewLoadingId === item._id ? "Saving..." : "Deny"}
                        </button>
                      </div>
                    </div>
                  </div>
                  {item.reviewNote ? (
                    <p className="mt-2 text-xs text-gray-600">Review note: {item.reviewNote}</p>
                  ) : null}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[720px] w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
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
