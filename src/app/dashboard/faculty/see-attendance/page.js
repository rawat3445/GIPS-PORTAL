"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mail,
  Phone,
  TrendingUp,
  XCircle,
} from "lucide-react";

function getCurrentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function getMonthStartDate(monthValue) {
  return new Date(`${monthValue}-01T00:00:00`);
}

function getDefaultSelectedDate(monthValue) {
  const today = new Date();
  const todayMonth = today.toISOString().slice(0, 7);

  if (todayMonth === monthValue) {
    return today.toISOString().slice(0, 10);
  }

  return `${monthValue}-01`;
}

function buildCalendarDays(monthValue) {
  const monthStart = getMonthStartDate(monthValue);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const startWeekday = monthStart.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < startWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function formatReadableDate(dateValue) {
  if (!dateValue) return "";

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getStatusClasses(status) {
  if (status === "present") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "absent") {
    return "bg-rose-100 text-rose-700";
  }

  if (status === "leave") {
    return "bg-amber-100 text-amber-700";
  }

   if (status === "holiday") {
    return "bg-sky-100 text-sky-700";
  }

  if (status === "vacation") {
    return "bg-cyan-100 text-cyan-700";
  }

  if (status === "event") {
    return "bg-violet-100 text-violet-700";
  }

  if (status === "internship") {
    return "bg-indigo-100 text-indigo-700";
  }

  if (status === "future") {
    return "bg-slate-100 text-slate-500";
  }

  return "bg-slate-100 text-slate-600";
}

function getStatusLabel(status) {
  if (status === "present") return "Present";
  if (status === "absent") return "Absent";
  if (status === "leave") return "Leave";
  if (status === "holiday") return "Holiday";
  if (status === "vacation") return "Vacation";
  if (status === "event") return "Event";
  if (status === "internship") return "Internship";
  if (status === "future") return "Future";
  return "Not Marked";
}

export default function FacultySeeAttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [selectedDate, setSelectedDate] = useState(
    getDefaultSelectedDate(getCurrentMonthValue()),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState({
    faculty: null,
    month: {
      value: getCurrentMonthValue(),
      label: "",
      from: "",
      to: "",
    },
    summary: {
      markedDays: 0,
      present: 0,
      absent: 0,
      leave: 0,
      holidayDays: 0,
      attendanceRate: 0,
    },
    calendar: [],
    records: [],
  });

  useEffect(() => {
    async function loadAttendance() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({ month: selectedMonth });
        const res = await fetch(`/api/faculty/self-attendance?${params}`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to load attendance");
        }

        setAttendance({
          faculty: data.faculty || null,
          month: data.month || {
            value: selectedMonth,
            label: "",
            from: "",
            to: "",
          },
          summary: data.summary || {
            markedDays: 0,
            present: 0,
            absent: 0,
            leave: 0,
            holidayDays: 0,
            attendanceRate: 0,
          },
          calendar: Array.isArray(data.calendar) ? data.calendar : [],
          records: Array.isArray(data.records) ? data.records : [],
        });
      } catch (err) {
        setError(err.message || "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, [selectedMonth]);

  useEffect(() => {
    setSelectedDate(getDefaultSelectedDate(selectedMonth));
  }, [selectedMonth]);

  const faculty = attendance.faculty;
  const isNonTeaching =
    String(faculty?.facultyType || "").trim() === "nonTeaching";
  const calendarByDate = useMemo(
    () =>
      new Map(
        attendance.calendar.map((day) => [day.date, day]),
      ),
    [attendance.calendar],
  );
  const calendarDays = useMemo(
    () => buildCalendarDays(selectedMonth),
    [selectedMonth],
  );
  const selectedDateInfo = calendarByDate.get(selectedDate) || {
    status: "not_marked",
    note: "",
  };
  const selectedDateStatus = selectedDateInfo.status;

  const summaryCards = [
    {
      title: "Present",
      value: attendance.summary.present,
      icon: CheckCircle2,
      shell: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Absent",
      value: attendance.summary.absent,
      icon: XCircle,
      shell: "bg-rose-100 text-rose-700",
    },
    {
      title: "Leave",
      value: attendance.summary.leave,
      icon: Clock3,
      shell: "bg-amber-100 text-amber-700",
    },
    {
      title: "Holiday",
      value: attendance.summary.holidayDays,
      icon: CalendarDays,
      shell: "bg-sky-100 text-sky-700",
    },
    {
      title: "Attendance Rate",
      value: `${attendance.summary.attendanceRate}%`,
      icon: TrendingUp,
      shell: "bg-indigo-100 text-indigo-700",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e0e7ff_0%,#eef2ff_28%,#f8fafc_62%,#f8fafc_100%)] px-4 py-6 md:px-6">
      <div className="rounded-[30px] border border-white/80 bg-white/88 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.42)] backdrop-blur md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-700">
              <CalendarDays className="h-3.5 w-3.5" />
              My Attendance
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
              My Attendance Overview
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {isNonTeaching
                ? "Admin marks your daily staff attendance, and you can review your monthly status here."
                : "This page shows your own faculty attendance record for the selected month."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Select Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Selected Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={`${selectedMonth}-01`}
                  max={`${selectedMonth}-${String(calendarDays.filter(Boolean).length).padStart(2, "0")}`}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(238,242,255,0.94),rgba(224,231,255,0.88))] p-5 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.38)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">
              Profile
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">
              {faculty?.name || "Faculty"}
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  {isNonTeaching ? (
                    <BriefcaseBusiness className="h-4 w-4 text-amber-600" />
                  ) : (
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                  )}
                  {isNonTeaching ? "Designation" : "Assigned Course"}
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {isNonTeaching
                    ? faculty?.designation || "Not added"
                    : faculty?.assignedCourse || "Not assigned"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Mail className="h-4 w-4 text-sky-600" />
                  Email
                </p>
                <p className="mt-2 break-all text-base font-semibold text-slate-950">
                  {faculty?.email || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm md:col-span-2">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  Phone
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {faculty?.phone || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.92),rgba(238,242,255,0.9))] p-5 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.38)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              {attendance.month.label || "Selected Month"}
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Attendance Summary
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Marked days:{" "}
              <span className="font-semibold text-slate-900">
                {attendance.summary.markedDays}
              </span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
              {summaryCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm"
                >
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.shell}`}
                  >
                    <card.icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    {card.title}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-white/80 bg-white/92 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.38)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-xl font-semibold text-slate-950">
              Attendance Calendar
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Click any day in {attendance.month.label || "the selected month"} to
              check its status.
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-6 text-sm text-slate-500">
              Loading attendance...
            </div>
          ) : error ? (
            <div className="px-5 py-6 text-sm text-rose-700">{error}</div>
          ) : (
            <div className="p-5">
              <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="rounded-xl bg-slate-50 px-2 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-2">
                {calendarDays.map((dateValue, index) => {
                  if (!dateValue) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="h-16 rounded-2xl border border-transparent bg-transparent"
                      />
                    );
                  }

                  const status =
                    calendarByDate.get(dateValue)?.status || "not_marked";
                  const isSelected = dateValue === selectedDate;

                  return (
                    <button
                      key={dateValue}
                      type="button"
                      onClick={() => setSelectedDate(dateValue)}
                      className={`flex h-16 flex-col items-start justify-between rounded-2xl border px-3 py-2 text-left transition ${
                        isSelected
                          ? "border-indigo-300 bg-indigo-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
                      }`}
                    >
                      <span className="text-sm font-semibold text-slate-900">
                        {Number(dateValue.slice(-2))}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${getStatusClasses(
                          status,
                        )}`}
                      >
                        {status === "not_marked" ? "Open" : getStatusLabel(status)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/80 bg-white/92 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.38)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-xl font-semibold text-slate-950">
                Selected Date Status
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review attendance for the chosen calendar date.
              </p>
            </div>

            <div className="p-5">
              <p className="text-sm font-medium text-slate-500">Selected date</p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {formatReadableDate(selectedDate)}
              </p>
              <div className="mt-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusClasses(
                    selectedDateStatus,
                  )}`}
                >
                  {getStatusLabel(selectedDateStatus)}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {selectedDateStatus === "not_marked"
                  ? "No attendance record was marked for this date."
                  : selectedDateInfo.note
                    ? `${selectedDateInfo.note}.`
                    : `Your attendance for ${formatReadableDate(selectedDate)} was marked as ${getStatusLabel(
                        selectedDateStatus,
                      ).toLowerCase()}.`}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/92 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.38)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-xl font-semibold text-slate-950">
                Marked Attendance Days
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing your attendance records for{" "}
                {attendance.month.label || "the selected month"}.
              </p>
            </div>

            {loading ? (
              <div className="px-5 py-6 text-sm text-slate-500">
                Loading attendance...
              </div>
            ) : error ? (
              <div className="px-5 py-6 text-sm text-rose-700">{error}</div>
            ) : attendance.records.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-500">
                No attendance records were marked for this month yet.
              </div>
            ) : (
              <div className="max-h-[420px] overflow-x-auto overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.records.map((record) => (
                      <tr key={record.date} className="border-t border-slate-100">
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {record.date}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusClasses(
                              record.status,
                            )}`}
                          >
                            {getStatusLabel(record.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
