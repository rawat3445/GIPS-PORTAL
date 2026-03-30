"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";

function getTodayISO() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getFacultyTypeLabel(type) {
  return type === "nonTeaching" ? "Non-Teaching" : "Teaching";
}

function getStatusBadge(status) {
  if (status === "present") return "bg-emerald-100 text-emerald-700";
  if (status === "absent") return "bg-rose-100 text-rose-700";
  if (status === "leave") return "bg-amber-100 text-amber-700";
  if (status === "holiday") return "bg-sky-100 text-sky-700";
  return "bg-slate-100 text-slate-600";
}

function QuickAttendanceBar({ title, onApply, disabled = false }) {
  const actions = [
    { label: "All Present", status: "present", shell: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { label: "All Absent", status: "absent", shell: "bg-rose-50 text-rose-700 border-rose-200" },
    { label: "All Leave", status: "leave", shell: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "All Holiday", status: "holiday", shell: "bg-sky-50 text-sky-700 border-sky-200" },
    { label: "Reset", status: "not_marked", shell: "bg-slate-50 text-slate-700 border-slate-200" },
  ];

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs text-slate-500">
          Quick attendance actions for this section
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => onApply(action.status)}
            disabled={disabled}
            className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${action.shell}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminFacultyAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [holidayInfo, setHolidayInfo] = useState(null);

  useEffect(() => {
    async function loadFacultyAttendance() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({ date: selectedDate });
        const res = await fetch(`/api/admin/faculty-attendance?${params}`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to load faculty attendance");
        }

        setMembers(Array.isArray(data.members) ? data.members : []);
        setHolidayInfo(data.holiday || null);
      } catch (err) {
        setError(err.message || "Failed to load faculty attendance");
        setMembers([]);
        setHolidayInfo(null);
      } finally {
        setLoading(false);
      }
    }

    loadFacultyAttendance();
  }, [selectedDate]);

  const visibleMembers = useMemo(() => {
    if (filter === "all") return members;
    return members.filter((member) => member.facultyType === filter);
  }, [filter, members]);

  const teachingMembers = visibleMembers.filter(
    (member) => member.facultyType === "teaching",
  );
  const nonTeachingMembers = visibleMembers.filter(
    (member) => member.facultyType === "nonTeaching",
  );

  const summary = useMemo(() => {
    return {
      total: members.length,
      teaching: members.filter((member) => member.facultyType === "teaching")
        .length,
      nonTeaching: members.filter(
        (member) => member.facultyType === "nonTeaching",
      ).length,
      present: members.filter((member) => member.status === "present").length,
      absent: members.filter((member) => member.status === "absent").length,
      leave: members.filter((member) => member.status === "leave").length,
      holiday: members.filter((member) => member.status === "holiday").length,
    };
  }, [members]);

  function updateStatus(id, status) {
    setMembers((prev) =>
      prev.map((member) =>
        member._id === id ? { ...member, status } : member,
      ),
    );
  }

  function applyQuickStatus(sectionMembers, status) {
    const targetIds = new Set(sectionMembers.map((member) => member._id));

    setMembers((prev) =>
      prev.map((member) =>
        targetIds.has(member._id) ? { ...member, status } : member,
      ),
    );
  }

  async function saveAttendance() {
    try {
      setSaving(true);

      const records = members
        .filter((member) => member.status !== "not_marked")
        .map((member) => ({
          facultyId: member._id,
          status: member.status,
        }));

      const res = await fetch("/api/admin/faculty-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: selectedDate,
          records,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to save faculty attendance");
      }

      alert(data.message || "Faculty attendance saved successfully");
    } catch (err) {
      alert(err.message || "Failed to save faculty attendance");
    } finally {
      setSaving(false);
    }
  }

  function renderTableRows(sectionMembers) {
    return sectionMembers.map((member) => (
      <tr key={member._id} className="border-t border-slate-100">
        <td className="px-5 py-4">
          <div>
            <p className="font-medium text-slate-900">{member.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {getFacultyTypeLabel(member.facultyType)}
            </p>
          </div>
        </td>
        <td className="px-5 py-4 text-sm text-slate-600">
          {member.facultyType === "teaching"
            ? member.assignedCourse || "-"
            : member.designation || "-"}
        </td>
        <td className="px-5 py-4 text-sm text-slate-600">
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="break-all">{member.email || "-"}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400" />
              <span>{member.phone || "-"}</span>
            </p>
          </div>
        </td>
        <td className="px-5 py-4">
          <select
            value={member.status}
            onChange={(e) => updateStatus(member._id, e.target.value)}
            className={`rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${getStatusBadge(
              member.status,
            )}`}
          >
            <option value="not_marked">Not Marked</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
            <option value="holiday">Holiday</option>
          </select>
        </td>
      </tr>
    ));
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fff7ed_25%,#f8fafc_60%,#f8fafc_100%)] px-4 py-6 md:px-6">
      <div className="rounded-[30px] border border-white/80 bg-white/88 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.42)] backdrop-blur md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Only
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
              Faculty Attendance
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Admin can record attendance for both teaching and non-teaching
              faculty from the same panel.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Attendance Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Filter
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All Faculty</option>
                <option value="teaching">Teaching Only</option>
                <option value="nonTeaching">Non-Teaching Only</option>
              </select>
            </div>

            <button
              type="button"
              onClick={saveAttendance}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 self-end rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>

        {holidayInfo ? (
          <div className="mt-6 rounded-[24px] border border-sky-200 bg-sky-50 px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-sky-900">
              College holiday found for {selectedDate}
            </p>
            <p className="mt-1 text-sm text-sky-700">
              {holidayInfo.title}. You can still choose attendance status manually if needed.
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#eef2ff)] p-4 shadow-sm">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <Users className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-500">Total Faculty</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{summary.total}</p>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#eff6ff)] p-4 shadow-sm">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <GraduationCap className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-500">Teaching</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{summary.teaching}</p>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#fff7ed)] p-4 shadow-sm">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-500">Non-Teaching</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{summary.nonTeaching}</p>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#ecfdf5)] p-4 shadow-sm">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CalendarDays className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-500">Present</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{summary.present}</p>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#fef2f2)] p-4 shadow-sm">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <CalendarDays className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-500">Absent / Leave</p>
            <p className="mt-2 text-3xl font-bold text-rose-700">
              {summary.absent + summary.leave}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(135deg,#ffffff,#eff6ff)] p-4 shadow-sm">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <CalendarDays className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-500">Holiday</p>
            <p className="mt-2 text-3xl font-bold text-sky-700">{summary.holiday}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading faculty attendance...
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="rounded-[28px] border border-white/80 bg-white/92 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.38)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-xl font-semibold text-slate-950">
                Teaching Faculty
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Course-assigned teaching staff marked by admin.
              </p>
            </div>
            <QuickAttendanceBar
              title="Teaching Quick Attendance"
              onApply={(status) => applyQuickStatus(teachingMembers, status)}
              disabled={teachingMembers.length === 0}
            />
            {teachingMembers.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-500">
                No teaching faculty in this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Course</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>{renderTableRows(teachingMembers)}</tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/92 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.38)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-xl font-semibold text-slate-950">
                Non-Teaching Faculty
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Designation-based non-teaching staff marked by admin.
              </p>
            </div>
            <QuickAttendanceBar
              title="Non-Teaching Quick Attendance"
              onApply={(status) => applyQuickStatus(nonTeachingMembers, status)}
              disabled={nonTeachingMembers.length === 0}
            />
            {nonTeachingMembers.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-500">
                No non-teaching faculty in this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Designation</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>{renderTableRows(nonTeachingMembers)}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
