"use client";

import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Sparkles } from "lucide-react";

function formatDate(value) {
  if (!value) return "Not published";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusClasses(status) {
  if (status === "pass") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "fail") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "pwg") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "bp") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "absent") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getAttendanceClasses(status) {
  if (status === "present") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "absent") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getPerformanceBarClasses(value) {
  if (value >= 75) {
    return "bg-emerald-500";
  }

  if (value >= 40) {
    return "bg-amber-500";
  }

  return "bg-rose-500";
}

function getSubjectCodesByStatus(subjects, status) {
  return (Array.isArray(subjects) ? subjects : [])
    .filter((subject) => String(subject?.subjectStatus || "").toLowerCase() === status)
    .map((subject) => subject.subjectCode)
    .filter(Boolean);
}

function getComponentIssues(subjects) {
  return (Array.isArray(subjects) ? subjects : []).flatMap((subject) => {
    const issues = [];
    const code = subject?.subjectCode;
    if (!code) return issues;

    if (subject?.hasTheory) {
      const theoryResult = String(subject?.theoryResultStatus || "").toLowerCase();
      if (["bp", "fail", "absent"].includes(theoryResult)) {
        issues.push({
          key: `${code}-theory-${theoryResult}`,
          label: `${code} Theory ${theoryResult.toUpperCase()}`,
          status: theoryResult,
        });
      }
    }

    if (subject?.hasPractical) {
      const practicalResult = String(subject?.practicalResultStatus || "").toLowerCase();
      if (["bp", "fail", "absent"].includes(practicalResult)) {
        issues.push({
          key: `${code}-practical-${practicalResult}`,
          label: `${code} Practical ${practicalResult.toUpperCase()}`,
          status: practicalResult,
        });
      }
    }

    return issues;
  });
}

export default function StudentResultsPage() {
  const [data, setData] = useState({ student: null, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/student/results", {
          credentials: "include",
          cache: "no-store",
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(result?.message || "Failed to load results");
        }

        setData({
          student: result.student || null,
          results: Array.isArray(result.results) ? result.results : [],
        });
      } catch (loadError) {
        setError(loadError.message || "Unable to load results");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#ede9fe_0%,#eef2ff_22%,#f8fafc_65%,#f8fafc_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,243,255,0.94),rgba(224,231,255,0.86))] p-5 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.32)] md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Student Results
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                View your published result sheets
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                Published results now follow a more formal batch-sheet layout with theory and practical marks, grand total, percentage, and final result.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Result Sets</p>
                <p className="mt-3 text-3xl font-bold text-violet-700">
                  {loading ? "..." : data.results.length}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Student Profile</p>
                <p className="mt-3 text-sm font-semibold text-slate-950">
                  {data.student
                    ? `${data.student.course} • Year ${data.student.year}`
                    : "Loading..."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
            Loading student results...
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-10 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </div>
        ) : data.results.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
            No result has been published for your profile yet.
          </div>
        ) : (
          <div className="space-y-6">
            {data.results.map((result) => (
              <section
                key={result._id}
                className="rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6"
              >
                {(() => {
                  const componentIssues = getComponentIssues(result.subjects);

                  return (
                    <>
                <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="truncate">{result.resultName}</span>
                      </span>
                      <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStatusClasses(result.resultStatus)}`}>
                        {String(result.resultStatus || "pending").toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Published on {formatDate(result.publishedAt)}
                    </p>
                    {componentIssues.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {componentIssues.map((issue) => (
                          <span
                            key={issue.key}
                            className={`max-w-full break-words rounded-2xl border px-3 py-2 text-xs font-semibold ${getStatusClasses(issue.status)}`}
                          >
                            {issue.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:w-[420px] xl:shrink-0">
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Grand Total</p>
                      <p className="mt-3 text-2xl font-bold text-slate-950">
                        {result.totalMarks}/{result.grandTotalMax || result.maxMarks}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Percentage</p>
                      <p className="mt-3 text-2xl font-bold text-blue-700">{result.percentage}%</p>
                    </div>
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Subjects</p>
                      <p className="mt-3 text-2xl font-bold text-violet-700">
                        {Array.isArray(result.subjects) ? result.subjects.length : 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-4 grid gap-3 2xl:grid-cols-3">
                    <div className="rounded-[22px] border border-violet-100 bg-violet-50/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">Combined Sheet</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Each subject now shows its own result status, so combined exam titles stay easy to read.
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status Breakdown</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(result.subjects || []).map((subject) => (
                          <span
                            key={`${result._id}-${subject.subjectCode}-chip`}
                            className={`max-w-full break-words rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(subject.subjectStatus)}`}
                          >
                            {subject.subjectCode}: {String(subject.subjectStatus || "pending").toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Result View</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Theory, practical, subject result, and performance are grouped side by side for quicker comparison.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:hidden">
                    {(result.subjects || []).map((subject) => {
                      const totalMax =
                        Number(subject.theoryMax || 0) +
                        Number(subject.practicalMax || 0);
                      const performance = totalMax
                        ? Number(((Number(subject.totalMarks || 0) / totalMax) * 100).toFixed(2))
                        : 0;

                      return (
                        <article
                          key={`${result._id}-${subject.subjectCode}-mobile`}
                          className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="inline-flex max-w-full rounded-2xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700">
                                {subject.subjectCode}
                              </div>
                              <p className="mt-3 break-words font-semibold text-slate-900">
                                {subject.subjectName || "Subject"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Max: {totalMax || 0} marks
                              </p>
                            </div>
                            <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(subject.subjectStatus)}`}>
                              {String(subject.subjectStatus || "pending").toUpperCase()}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Theory</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getAttendanceClasses(subject.theoryStatus)}`}>
                                  {String(subject.theoryStatus || "present").toUpperCase()}
                                </span>
                                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(subject.theoryResultStatus)}`}>
                                  {String(subject.theoryResultStatus || "pending").toUpperCase()}
                                </span>
                              </div>
                              <p className="mt-3 text-base font-bold text-slate-900">
                                {subject.hasTheory
                                  ? subject.theoryStatus === "absent"
                                    ? "ABSENT"
                                    : `${subject.theoryMarks}/${subject.theoryMax}`
                                  : "N/A"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Practical</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getAttendanceClasses(subject.practicalStatus)}`}>
                                  {String(subject.practicalStatus || "present").toUpperCase()}
                                </span>
                                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(subject.practicalResultStatus)}`}>
                                  {String(subject.practicalResultStatus || "pending").toUpperCase()}
                                </span>
                              </div>
                              <p className="mt-3 text-base font-bold text-slate-900">
                                {subject.hasPractical
                                  ? subject.practicalStatus === "absent"
                                    ? "ABSENT"
                                    : `${subject.practicalMarks}/${subject.practicalMax}`
                                  : "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Total</p>
                              <p className="mt-2 text-lg font-bold">{subject.totalMarks}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                <span>Performance</span>
                                <span>{performance}%</span>
                              </div>
                              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full rounded-full ${getPerformanceBarClasses(performance)}`}
                                  style={{ width: `${Math.min(performance, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}

                    <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                        Grand Total
                      </p>
                      <p className="mt-3 text-2xl font-bold text-slate-950">
                        {result.totalMarks}/{result.grandTotalMax || result.maxMarks}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Overall Percentage</span>
                        <span>{result.percentage}%</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${getPerformanceBarClasses(result.percentage)}`}
                          style={{ width: `${Math.min(result.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="hidden xl:block">
                    <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_-35px_rgba(15,23,42,0.45)]">
                    <table className="min-w-[1280px] w-full bg-white text-sm">
                      <thead>
                        <tr className="bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
                          <th className="border-b border-r border-slate-200 px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Subject Code</th>
                          <th className="border-b border-r border-slate-200 px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Subject</th>
                          <th className="border-b border-r border-slate-200 px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Theory Marks</th>
                          <th className="border-b border-r border-slate-200 px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Practical Marks</th>
                          <th className="border-b border-r border-slate-200 px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Subject Result</th>
                          <th className="border-b border-r border-slate-200 px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Total Marks</th>
                          <th className="border-b border-slate-200 px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result.subjects || []).map((subject, index) => {
                          const totalMax =
                            Number(subject.theoryMax || 0) +
                            Number(subject.practicalMax || 0);
                          const performance = totalMax
                            ? Number(((Number(subject.totalMarks || 0) / totalMax) * 100).toFixed(2))
                            : 0;

                          return (
                            <tr
                              key={`${result._id}-${subject.subjectCode}`}
                              className={index % 2 === 0 ? "bg-white" : "bg-slate-50/55"}
                            >
                              <td className="border-r border-slate-200 px-4 py-4 align-top">
                                <div className="inline-flex rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700">
                                  {subject.subjectCode}
                                </div>
                              </td>
                              <td className="border-r border-slate-200 px-4 py-4 align-top">
                                <div>
                                  <p className="font-semibold text-slate-900">{subject.subjectName || "Subject"}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Max: {totalMax || 0} marks
                                  </p>
                                </div>
                              </td>
                              <td className="border-r border-slate-200 px-4 py-4 align-top text-center">
                                <div className="inline-flex min-w-[124px] flex-col rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Theory</span>
                                  <span className={`mt-2 inline-flex self-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getAttendanceClasses(subject.theoryStatus)}`}>
                                    {String(subject.theoryStatus || "present").toUpperCase()}
                                  </span>
                                  <span className={`mt-2 inline-flex self-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(subject.theoryResultStatus)}`}>
                                    {String(subject.theoryResultStatus || "pending").toUpperCase()}
                                  </span>
                                  <span className="mt-2 text-base font-bold text-slate-900">
                                    {subject.hasTheory
                                      ? subject.theoryStatus === "absent"
                                        ? "ABSENT"
                                        : `${subject.theoryMarks}/${subject.theoryMax}`
                                      : "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="border-r border-slate-200 px-4 py-4 align-top text-center">
                                <div className="inline-flex min-w-[124px] flex-col rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Practical</span>
                                  <span className={`mt-2 inline-flex self-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getAttendanceClasses(subject.practicalStatus)}`}>
                                    {String(subject.practicalStatus || "present").toUpperCase()}
                                  </span>
                                  <span className={`mt-2 inline-flex self-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(subject.practicalResultStatus)}`}>
                                    {String(subject.practicalResultStatus || "pending").toUpperCase()}
                                  </span>
                                  <span className="mt-2 text-base font-bold text-slate-900">
                                    {subject.hasPractical
                                      ? subject.practicalStatus === "absent"
                                        ? "ABSENT"
                                        : `${subject.practicalMarks}/${subject.practicalMax}`
                                      : "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="border-r border-slate-200 px-4 py-4 align-top text-center">
                                <span className={`inline-flex rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(subject.subjectStatus)}`}>
                                  {String(subject.subjectStatus || "pending").toUpperCase()}
                                </span>
                              </td>
                              <td className="border-r border-slate-200 px-4 py-4 align-top text-center">
                                <div className="inline-flex min-w-[110px] flex-col rounded-2xl bg-slate-900 px-4 py-3 text-white">
                                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Total</span>
                                  <span className="mt-2 text-lg font-bold">
                                    {subject.totalMarks}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="mx-auto max-w-[180px]">
                                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                    <span>Score</span>
                                    <span>{performance}%</span>
                                  </div>
                                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                      className={`h-full rounded-full ${getPerformanceBarClasses(performance)}`}
                                      style={{ width: `${Math.min(performance, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
                          <td
                            colSpan={5}
                            className="border-r border-t border-slate-200 px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600"
                          >
                            Grand Total
                          </td>
                          <td className="border-r border-t border-slate-200 px-4 py-4 text-center">
                            <div className="inline-flex min-w-[130px] flex-col rounded-2xl bg-slate-900 px-4 py-3 text-white">
                              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                                Total Marks
                              </span>
                              <span className="mt-2 text-lg font-bold">
                                {result.totalMarks}/{result.grandTotalMax || result.maxMarks}
                              </span>
                            </div>
                          </td>
                          <td className="border-t border-slate-200 px-4 py-4 text-center">
                            <div className="mx-auto max-w-[180px]">
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                <span>Overall</span>
                                <span>{result.percentage}%</span>
                              </div>
                              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full rounded-full ${getPerformanceBarClasses(result.percentage)}`}
                                  style={{ width: `${Math.min(result.percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                    </div>
                  </div>
                </div>

                {result.remarks ? (
                  <div className="mt-5 rounded-[22px] border border-blue-100 bg-blue-50/70 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-700" />
                      <p className="text-sm font-semibold text-blue-800">Remarks</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-blue-800">{result.remarks}</p>
                  </div>
                ) : null}
                    </>
                  );
                })()}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
