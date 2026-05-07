"use client";

import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Download, Eye, Sparkles, X } from "lucide-react";

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getResultFileName(student, result) {
  const safeParts = [
    student?.enrollmentNo || student?.name || "student-result",
    result?.resultName || "result",
  ]
    .map((part) =>
      String(part || "")
        .trim()
        .replace(/[^\w\-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .filter(Boolean);

  return `${safeParts.join("_") || "student-result"}.pdf`;
}

function buildPrintableResultHtml(student, result) {
  const subjects = Array.isArray(result?.subjects) ? result.subjects : [];
  const rows = subjects
    .map((subject, index) => {
      const totalMax =
        Number(subject?.theoryMax || 0) + Number(subject?.practicalMax || 0);
      const performance = totalMax
        ? Number(((Number(subject?.totalMarks || 0) / totalMax) * 100).toFixed(2))
        : 0;

      return `
        <tr class="${index % 2 === 0 ? "row-even" : "row-odd"}">
          <td>${escapeHtml(subject?.subjectCode || "-")}</td>
          <td>
            <div class="subject-name">${escapeHtml(subject?.subjectName || "Subject")}</div>
            <div class="subject-meta">Max: ${totalMax || 0} marks</div>
          </td>
          <td>${subject?.hasTheory ? (String(subject?.theoryStatus || "").toLowerCase() === "absent" ? "ABSENT" : `${Number(subject?.theoryMarks || 0)}/${Number(subject?.theoryMax || 0)}`) : "N/A"}</td>
          <td>${subject?.hasPractical ? (String(subject?.practicalStatus || "").toLowerCase() === "absent" ? "ABSENT" : `${Number(subject?.practicalMarks || 0)}/${Number(subject?.practicalMax || 0)}`) : "N/A"}</td>
          <td>${escapeHtml(String(subject?.subjectStatus || "pending").toUpperCase())}</td>
          <td>${Number(subject?.totalMarks || 0)}</td>
          <td>${performance}%</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(result?.resultName || "Student Result")}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            background: #ffffff;
          }
          .sheet {
            width: 100%;
            border: 1px solid #cbd5e1;
            border-radius: 18px;
            padding: 18px;
          }
          .topbar {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: flex-start;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 14px;
          }
          .eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #6d28d9;
          }
          h1 {
            margin: 8px 0 0;
            font-size: 26px;
            line-height: 1.15;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            margin-top: 18px;
          }
          .meta-card {
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 12px;
            background: #f8fafc;
          }
          .meta-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #64748b;
          }
          .meta-value {
            margin-top: 8px;
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 10px 8px;
            vertical-align: top;
          }
          th {
            background: #eef2ff;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #475569;
          }
          .row-odd { background: #f8fafc; }
          .subject-name {
            font-weight: 700;
            color: #0f172a;
          }
          .subject-meta {
            margin-top: 4px;
            font-size: 10px;
            color: #64748b;
          }
          .remarks {
            margin-top: 16px;
            border: 1px solid #dbeafe;
            background: #eff6ff;
            border-radius: 14px;
            padding: 14px;
          }
          .remarks-title {
            font-size: 12px;
            font-weight: 700;
            color: #1d4ed8;
          }
          .remarks-body {
            margin-top: 6px;
            font-size: 12px;
            line-height: 1.6;
            color: #1e3a8a;
            white-space: pre-wrap;
          }
          .print-note {
            margin-top: 14px;
            font-size: 10px;
            color: #64748b;
            text-align: right;
          }
          @media print {
            .sheet {
              border: none;
              border-radius: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <section class="topbar">
            <div>
              <div class="eyebrow">GIPS Student Result</div>
              <h1>${escapeHtml(result?.resultName || "Published Result Sheet")}</h1>
            </div>
            <div class="meta-label">Published: ${escapeHtml(formatDate(result?.publishedAt))}</div>
          </section>

          <section class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Student</div>
              <div class="meta-value">${escapeHtml(student?.name || "-")}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Enrollment No</div>
              <div class="meta-value">${escapeHtml(student?.enrollmentNo || "-")}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Course / Year</div>
              <div class="meta-value">${escapeHtml(`${student?.course || "-"} / Year ${student?.year || "-"}`)}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Final Result</div>
              <div class="meta-value">${escapeHtml(String(result?.resultStatus || "pending").toUpperCase())}</div>
            </div>
          </section>

          <section class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Grand Total</div>
              <div class="meta-value">${Number(result?.totalMarks || 0)}/${Number(result?.grandTotalMax || result?.maxMarks || 0)}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Percentage</div>
              <div class="meta-value">${Number(result?.percentage || 0)}%</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Subjects</div>
              <div class="meta-value">${subjects.length}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Status</div>
              <div class="meta-value">${escapeHtml(String(result?.resultStatus || "pending").toUpperCase())}</div>
            </div>
          </section>

          <table>
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Subject</th>
                <th>Theory Marks</th>
                <th>Practical Marks</th>
                <th>Subject Result</th>
                <th>Total Marks</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          ${result?.remarks ? `
            <section class="remarks">
              <div class="remarks-title">Remarks</div>
              <div class="remarks-body">${escapeHtml(result.remarks)}</div>
            </section>
          ` : ""}

          <div class="print-note">Use the browser print dialog to save this sheet as PDF or print it.</div>
        </main>
      </body>
    </html>
  `;
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
  const [previewResult, setPreviewResult] = useState(null);

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

  function handlePrintDownload(result) {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1100,height=900");
    if (!printWindow) {
      setError("Unable to open print preview. Please allow popups and try again.");
      return;
    }

    const html = buildPrintableResultHtml(data.student, result);
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.document.title = getResultFileName(data.student, result);
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  }

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

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewResult(result)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                  >
                    <Eye className="h-4 w-4" />
                    Preview Result
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintDownload(result)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4" />
                    Download / Print
                  </button>
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

      {previewResult ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.55)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 md:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-700">
                  Print Preview
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {previewResult.resultName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Preview this sheet first, then use download to save it as PDF or print it.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintDownload(previewResult)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" />
                  Download / Print
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewResult(null)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto bg-slate-100 p-4 md:p-6">
              <div className="mx-auto w-full max-w-[850px] rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.35)] md:p-8">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-700">
                      GIPS Student Result
                    </p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                      {previewResult.resultName}
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    Published: {formatDate(previewResult.publishedAt)}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Student</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{data.student?.name || "-"}</p>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Enrollment No</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{data.student?.enrollmentNo || "-"}</p>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Course / Year</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{data.student?.course || "-"} / Year {data.student?.year || "-"}</p>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Final Result</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{String(previewResult.resultStatus || "pending").toUpperCase()}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Grand Total</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{previewResult.totalMarks}/{previewResult.grandTotalMax || previewResult.maxMarks}</p>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Percentage</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{previewResult.percentage}%</p>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Subjects</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{Array.isArray(previewResult.subjects) ? previewResult.subjects.length : 0}</p>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{String(previewResult.resultStatus || "pending").toUpperCase()}</p>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto rounded-[22px] border border-slate-200">
                  <table className="min-w-[900px] w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
                        <th className="border-b border-r border-slate-200 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Subject Code</th>
                        <th className="border-b border-r border-slate-200 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Subject</th>
                        <th className="border-b border-r border-slate-200 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Theory Marks</th>
                        <th className="border-b border-r border-slate-200 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Practical Marks</th>
                        <th className="border-b border-r border-slate-200 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Subject Result</th>
                        <th className="border-b border-r border-slate-200 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Total Marks</th>
                        <th className="border-b border-slate-200 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(previewResult.subjects || []).map((subject, index) => {
                        const totalMax =
                          Number(subject.theoryMax || 0) +
                          Number(subject.practicalMax || 0);
                        const performance = totalMax
                          ? Number(((Number(subject.totalMarks || 0) / totalMax) * 100).toFixed(2))
                          : 0;

                        return (
                          <tr
                            key={`${previewResult._id}-${subject.subjectCode}-preview`}
                            className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                          >
                            <td className="border-b border-r border-slate-200 px-4 py-3 font-semibold text-slate-900">{subject.subjectCode || "-"}</td>
                            <td className="border-b border-r border-slate-200 px-4 py-3">
                              <p className="font-semibold text-slate-900">{subject.subjectName || "Subject"}</p>
                              <p className="mt-1 text-xs text-slate-500">Max: {totalMax || 0} marks</p>
                            </td>
                            <td className="border-b border-r border-slate-200 px-4 py-3 text-center text-slate-700">
                              {subject.hasTheory
                                ? subject.theoryStatus === "absent"
                                  ? "ABSENT"
                                  : `${subject.theoryMarks}/${subject.theoryMax}`
                                : "N/A"}
                            </td>
                            <td className="border-b border-r border-slate-200 px-4 py-3 text-center text-slate-700">
                              {subject.hasPractical
                                ? subject.practicalStatus === "absent"
                                  ? "ABSENT"
                                  : `${subject.practicalMarks}/${subject.practicalMax}`
                                : "N/A"}
                            </td>
                            <td className="border-b border-r border-slate-200 px-4 py-3 text-center font-semibold text-slate-900">
                              {String(subject.subjectStatus || "pending").toUpperCase()}
                            </td>
                            <td className="border-b border-r border-slate-200 px-4 py-3 text-center font-semibold text-slate-900">
                              {subject.totalMarks}
                            </td>
                            <td className="border-b border-slate-200 px-4 py-3 text-center text-slate-700">
                              {performance}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {previewResult.remarks ? (
                  <div className="mt-5 rounded-[22px] border border-blue-100 bg-blue-50/70 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-700" />
                      <p className="text-sm font-semibold text-blue-800">Remarks</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-blue-800">{previewResult.remarks}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
