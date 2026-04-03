"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  Filter,
  Search,
  UserRound,
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
];

function formatDateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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

function buildSummary(logs) {
  return logs.reduce(
    (acc, log) => {
      acc.total += 1;
      if (log.actorRole === "admin") acc.admin += 1;
      if (log.actorRole === "faculty") acc.faculty += 1;
      if (log.actorRole === "student") acc.student += 1;
      return acc;
    },
    {
      total: 0,
      admin: 0,
      faculty: 0,
      student: 0,
    },
  );
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [actionType, setActionType] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          limit: "120",
        });

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
      } catch (loadError) {
        setError(loadError.message || "Unable to load activity logs");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [role, actionType, search]);

  const summary = useMemo(() => buildSummary(logs), [logs]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
            <Activity className="h-3.5 w-3.5" />
            Activity Logs
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            User Activity Timeline
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Review sign-ins, page visits, admin actions, and attendance updates with user names.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: summary.total, tone: "text-slate-900" },
            { label: "Admins", value: summary.admin, tone: "text-amber-700" },
            { label: "Faculty", value: summary.faculty, tone: "text-indigo-700" },
            { label: "Students", value: summary.student, tone: "text-emerald-700" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.label}
              </p>
              <p className={`mt-2 text-2xl font-bold ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

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
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {log.actionLabel}
                  </p>
                  {log.details ? (
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {log.details}
                    </p>
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
