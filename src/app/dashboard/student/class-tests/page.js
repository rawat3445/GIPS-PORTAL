"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Sparkles, Target } from "lucide-react";

function getStatusShell(status) {
  if (status === "pass") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "fail") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "absent") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function StudentClassTestsPage() {
  const [data, setData] = useState({ student: null, summary: null, tests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/student/class-tests", {
          credentials: "include",
          cache: "no-store",
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(result?.message || "Failed to load class tests");
        }

        setData({
          student: result.student || null,
          summary: result.summary || null,
          tests: Array.isArray(result.tests) ? result.tests : [],
        });
      } catch (loadError) {
        setError(loadError.message || "Unable to load class tests");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const summary = data.summary || {
    totalTests: 0,
    averagePercentage: 0,
    passedTests: 0,
    failedTests: 0,
    absentTests: 0,
    pendingTests: 0,
    totalPoints: 0,
    maxPoints: 25,
    averagePerformancePoints: 0,
    averagePerformanceMax: 15,
    consistencyPoints: 0,
    consistencyMax: 5,
    improvementTrendPoints: 0,
    improvementTrendMax: 5,
    improvementLabel: "No evaluated tests yet",
    latestTestName: "",
    latestSubjectLabel: "",
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#ede9fe_0%,#eef2ff_22%,#f8fafc_65%,#f8fafc_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto w-full max-w-[1450px] space-y-6">
        <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,243,255,0.94),rgba(224,231,255,0.86))] p-5 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.32)] md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Class Tests
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Track your class test performance
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                See each published class test for your course and year, along
                with your marks, pass or fail status, extra criteria, and the
                points impact for the class-test category. This category is
                stricter than attendance, so weak averages, absences, or too
                few evaluated tests reduce the score quickly.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[460px]">
              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Total Tests
                </p>
                <p className="mt-3 text-3xl font-bold text-violet-700">
                  {loading ? "..." : summary.totalTests}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Category Points
                </p>
                <p className="mt-3 text-3xl font-bold text-amber-700">
                  {loading ? "..." : `${summary.totalPoints}/${summary.maxPoints}`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
            Loading class tests...
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-10 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </div>
        ) : (
          <>
            <section className="rounded-[30px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
                    Performance Summary
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Your current class test picture
                  </h2>
                </div>
                <Link
                  href="/dashboard/student/points"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Open Student Points
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Average Percentage
                  </p>
                  <p className="mt-3 text-3xl font-bold text-blue-700">
                    {summary.averagePercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Passed Tests
                  </p>
                  <p className="mt-3 text-3xl font-bold text-emerald-700">
                    {summary.passedTests}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Failed Tests
                  </p>
                  <p className="mt-3 text-3xl font-bold text-rose-700">
                    {summary.failedTests}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Pending / Absent
                  </p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {summary.pendingTests + summary.absentTests}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                <div className="rounded-[24px] border border-blue-100 bg-blue-50/80 p-4">
                  <p className="text-sm font-semibold text-blue-800">
                    Average performance score
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-700">
                    {summary.averagePerformancePoints}/{summary.averagePerformanceMax}
                  </p>
                </div>
                <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4">
                  <p className="text-sm font-semibold text-emerald-800">
                    Consistency score
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {summary.consistencyPoints}/{summary.consistencyMax}
                  </p>
                </div>
                <div className="rounded-[24px] border border-violet-100 bg-violet-50/80 p-4">
                  <p className="text-sm font-semibold text-violet-800">
                    Improvement trend score
                  </p>
                  <p className="mt-2 text-2xl font-bold text-violet-700">
                    {summary.improvementTrendPoints}/{summary.improvementTrendMax}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/80 bg-slate-50/90 p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-violet-700" />
                  <p className="text-sm font-semibold text-slate-900">
                    Trend insight
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {summary.improvementLabel}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Guidance: top class-test points need strong averages, regular
                  completion, very few absences, and at least three evaluated
                  tests before improvement points begin counting.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              {data.tests.length === 0 ? (
                <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
                  No class test has been published for your profile yet.
                </div>
              ) : (
                data.tests.map((test) => (
                  <article
                    key={test._id}
                    className="rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span className="truncate">{test.classTestName}</span>
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStatusShell(
                              test.status,
                            )}`}
                          >
                            {String(test.status || "pending").toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                          {test.subjectLabel} • Test date {formatDate(test.testDate)} •
                          Published {formatDate(test.publishedAt)}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 xl:w-[430px]">
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Marks
                          </p>
                          <p className="mt-3 text-2xl font-bold text-slate-950">
                            {test.marksObtained}/{test.totalMarks}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Percentage
                          </p>
                          <p className="mt-3 text-2xl font-bold text-blue-700">
                            {test.totalMarks
                              ? `${((test.marksObtained / test.totalMarks) * 100).toFixed(1)}%`
                              : "0.0%"}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Pass Line
                          </p>
                          <p className="mt-3 text-2xl font-bold text-emerald-700">
                            {test.passingMarks}
                          </p>
                        </div>
                      </div>
                    </div>

                    {test.extraCriteria ? (
                      <div className="mt-5 rounded-[22px] border border-blue-100 bg-blue-50/70 p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-700" />
                          <p className="text-sm font-semibold text-blue-800">
                            Extra criteria
                          </p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-blue-800">
                          {test.extraCriteria}
                        </p>
                      </div>
                    ) : null}

                    {test.remarks ? (
                      <div className="mt-4 rounded-[22px] border border-violet-100 bg-violet-50/70 p-4">
                        <p className="text-sm font-semibold text-violet-800">
                          Remarks
                        </p>
                        <p className="mt-2 text-sm leading-6 text-violet-800">
                          {test.remarks}
                        </p>
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
