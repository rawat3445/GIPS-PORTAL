"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  MessageSquareText,
  Star,
  Trash2,
  Users,
} from "lucide-react";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ReviewMetric({ title, value, note, icon: Icon, tone = "amber" }) {
  const tones = {
    amber: "border-amber-200 bg-amber-50/80 text-amber-700",
    blue: "border-blue-200 bg-blue-50/80 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50/80 text-emerald-700",
  };
  const style = tones[tone] || tones.amber;

  return (
    <div className="rounded-[24px] border border-white/80 bg-white/92 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
        </div>
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${style}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default function AdminFacultyReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [data, setData] = useState({
    totalReviews: 0,
    ratedReviews: 0,
    averageOverallRating: 0,
    reviews: [],
    facultySummary: [],
  });

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
      try {
        setLoading(true);
        setError("");
        setNotice("");

        const res = await fetch("/api/admin/faculty-reviews", {
          credentials: "include",
          cache: "no-store",
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            result?.message || "Unable to load faculty reviews right now.",
          );
        }

        setData({
          totalReviews: Number(result?.totalReviews || 0),
          ratedReviews: Number(result?.ratedReviews || 0),
          averageOverallRating: Number(result?.averageOverallRating || 0),
          reviews: Array.isArray(result?.reviews) ? result.reviews : [],
          facultySummary: Array.isArray(result?.facultySummary)
            ? result.facultySummary
            : [],
        });
      } catch (loadError) {
        setError(loadError.message || "Unable to load faculty reviews right now.");
      } finally {
        setLoading(false);
      }
    }

  async function handleDelete(reviewId) {
    try {
      setDeletingId(reviewId);
      setError("");
      setNotice("");

      const res = await fetch(
        `/api/admin/faculty-reviews?id=${encodeURIComponent(reviewId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result?.message || "Unable to delete review right now.");
      }

      setNotice(result?.message || "Review deleted successfully.");
      await loadReviews();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete review right now.");
    } finally {
      setDeletingId("");
    }
  }

  const topFaculty = useMemo(
    () => data.facultySummary.slice(0, 6),
    [data.facultySummary],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed_0%,#fffbeb_24%,#f8fafc_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,251,235,0.95),rgba(254,243,199,0.86))] p-5 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <MessageSquareText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
                Faculty Reviews
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Student ratings and comments for faculty
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Admin can review faculty-wise ratings, student names, course,
                year, and the exact written comments submitted from the student
                panel.
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700 shadow-sm">
            {notice}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <ReviewMetric
            title="Total Reviews"
            value={loading ? "..." : data.totalReviews}
            note="All student faculty reviews submitted in the portal."
            icon={MessageSquareText}
            tone="blue"
          />
          <ReviewMetric
            title="Average Rating"
            value={
              loading
                ? "..."
                : data.ratedReviews > 0
                  ? `${data.averageOverallRating} / 5`
                  : "No ratings"
            }
            note="Average rating across review entries that actually included ratings."
            icon={Star}
            tone="amber"
          />
          <ReviewMetric
            title="Faculty Covered"
            value={loading ? "..." : data.facultySummary.length}
            note="Faculty members who have received at least one review."
            icon={GraduationCap}
            tone="emerald"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Staff Summary
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  Rating by staff name
                </h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Users className="h-5 w-5" />
              </span>
            </div>

            {loading ? (
              <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                Loading faculty summary...
              </div>
            ) : !topFaculty.length ? (
              <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                No faculty reviews submitted yet.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {topFaculty.map((item) => (
                  <div
                    key={`${item.facultyId}-${item.facultyName}`}
                    className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-950">
                          {item.facultyName}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.facultyAssignedCourse || "Unassigned"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                          {item.ratedReviewCount > 0 ? `${item.averageRating} / 5` : "No rating"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          {item.reviewCount} review{item.reviewCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Latest review: {formatDateTime(item.latestReviewAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.35)] md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Recent Submissions
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Student name, course, and comments
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              This list keeps the exact staff name, student name, course, year,
              rating, and each question score together.
            </p>

            {loading ? (
              <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                Loading reviews...
              </div>
            ) : !data.reviews.length ? (
              <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                No reviews submitted yet.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {data.reviews.map((review) => (
                  <article
                    key={review._id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-950">
                            {review.facultyName}
                          </h3>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                            {review.overallRating ? `${review.overallRating} / 5` : "Comment only"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {review.facultyAssignedCourse || review.course || "-"}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(review.createdAt)}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Student
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {review.studentName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {review.studentEmail || "No email"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Course
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {review.course || "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {review.year ? `Year ${review.year}` : "Year not set"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Staff Rating
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {review.facultyName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {review.overallRating
                            ? `Overall ${review.overallRating} / 5`
                            : "No rating submitted"}
                        </p>
                      </div>
                    </div>

                    {(Array.isArray(review.responses) ? review.responses : []).length ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {(Array.isArray(review.responses) ? review.responses : []).map(
                        (item) => (
                          <div
                            key={`${review._id}-${item.questionKey}`}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                          >
                            <p className="text-sm font-medium leading-6 text-slate-700">
                              {item.questionLabel}
                            </p>
                            <p className="mt-3 text-sm font-semibold text-slate-950">
                              Rating: {item.rating} / 5
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                        This review was submitted without ratings.
                      </div>
                    )}

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Student Comment
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {review.comment || "No written comment submitted."}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDelete(review._id)}
                        disabled={deletingId === review._id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === review._id ? "Deleting..." : "Delete Review"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
