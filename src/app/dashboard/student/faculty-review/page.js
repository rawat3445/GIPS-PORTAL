"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  MessageSquareText,
  Send,
  Shield,
  Star,
  UsersRound,
} from "lucide-react";
import {
  FACULTY_REVIEW_RATING_OPTIONS,
  createDefaultFacultyReviewRatings,
} from "../../../lib/facultyReview";

function formatCourseYear(course, year) {
  const parts = [course || "", year ? `Year ${year}` : ""].filter(Boolean);
  return parts.join(" | ") || "Course details unavailable";
}

export default function StudentFacultyReviewPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [student, setStudent] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [privacyNote, setPrivacyNote] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [comment, setComment] = useState("");
  const [ratings, setRatings] = useState(createDefaultFacultyReviewRatings());

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/student/faculty-reviews", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data?.message || "Unable to load the faculty review page.",
          );
        }

        const questionList = Array.isArray(data?.questions) ? data.questions : [];
        const facultyList = Array.isArray(data?.faculty) ? data.faculty : [];

        setStudent(data?.student || null);
        setFaculty(facultyList);
        setQuestions(questionList);
        setPrivacyNote(data?.privacyNote || "");
        setSelectedFacultyId((current) => current || facultyList[0]?._id || "");
        setRatings(createDefaultFacultyReviewRatings());
      } catch (loadError) {
        setError(loadError.message || "Unable to load the faculty review page.");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, []);

  const selectedFaculty = useMemo(
    () => faculty.find((item) => item._id === selectedFacultyId) || null,
    [faculty, selectedFacultyId],
  );

  const averageRating = useMemo(() => {
    const values = questions
      .map((question) => ratings[question.key])
      .map((value) =>
        value === null || value === undefined || value === ""
          ? null
          : Number(value),
      )
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

    if (!values.length) {
      return 0;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    return Number((total / values.length).toFixed(1));
  }, [questions, ratings]);

  function updateRating(questionKey, value) {
    setRatings((current) => ({
      ...current,
      [questionKey]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setNotice("");

      const responses = questions.map((question) => ({
        questionKey: question.key,
        rating: Number(ratings[question.key] || 0),
      }));

      const res = await fetch("/api/student/faculty-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          facultyId: selectedFacultyId,
          comment,
          responses,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to submit faculty review.");
      }

      setNotice(data?.message || "Faculty review submitted successfully.");
      setComment("");
      setRatings(createDefaultFacultyReviewRatings());
    } catch (submitError) {
      setError(submitError.message || "Unable to submit faculty review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eff6ff_26%,#f8fafc_62%,#f8fafc_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.95),rgba(224,231,255,0.9))] p-5 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700 shadow-sm">
                <MessageSquareText className="h-3.5 w-3.5" />
                Faculty Review
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Review your course faculty your way
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                You can submit only ratings, only a written comment, or both.
                Your review stays confidential on the student side and is not
                shown to faculty or other students.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Confidential
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Private student review
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Your personal details are not shown here on the review screen.
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Privacy Note
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Hidden from faculty
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {privacyNote || "Your review is not shown to faculty or other students."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {notice ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700 shadow-sm">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(300px,0.72fr)]">
          <section className="rounded-[30px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] md:p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Review Form
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Submit your faculty review
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Choose one faculty member from your course, then add ratings, a
                comment, or both.
              </p>
            </div>

            {loading ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-sm text-slate-500">
                Loading faculty review form...
              </div>
            ) : !faculty.length ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-amber-300 bg-amber-50 px-5 py-10 text-sm text-amber-800">
                No teaching faculty is linked to your course yet. Please ask admin
                to assign course faculty first.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <label className="block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Faculty Member
                  </p>
                  <select
                    value={selectedFacultyId}
                    onChange={(event) => setSelectedFacultyId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
                  >
                    {faculty.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} - {item.assignedCourse}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Optional Ratings
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Select only the questions you want to rate from 1 to 5.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRatings(createDefaultFacultyReviewRatings())}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                    >
                      Clear ratings
                    </button>
                  </div>
                  <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div
                      key={question.key}
                      className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Question {index + 1}
                          </p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">
                            {question.label}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {FACULTY_REVIEW_RATING_OPTIONS.map((value) => {
                            const active = Number(ratings[question.key]) === value;

                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => updateRating(question.key, value)}
                                className={`inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition ${
                                  active
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-700"
                                }`}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>

                <label className="block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Optional Comment
                  </p>
                  <textarea
                    rows={7}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={2000}
                    placeholder="Write anything specific you want to share about this faculty member. You can send only this comment even without ratings."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Comment is optional. Submit at least one rating or one comment.
                  </p>
                </label>

                <button
                  type="submit"
                  disabled={submitting || !selectedFacultyId}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Faculty Review"}
                </button>
              </form>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(254,249,195,0.92),rgba(255,255,255,0.96))] p-5 shadow-[0_24px_60px_-42px_rgba(217,119,6,0.22)] md:p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Star className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                    Rating Summary
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Current average
                  </h2>
                </div>
              </div>
              <div className="mt-5 rounded-[24px] border border-white/80 bg-white/88 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Selected Faculty
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {selectedFaculty?.name || "Choose faculty"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedFaculty?.assignedCourse || student?.course || "-"}
                </p>
                <div className="mt-4 flex items-end gap-3">
                  <p className="text-4xl font-bold tracking-tight text-amber-700">
                    {averageRating || "0.0"}
                  </p>
                  <p className="pb-1 text-sm font-semibold text-slate-600">/ 5</p>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  This changes only from the ratings you actually select.
                </p>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,253,245,0.92),rgba(255,255,255,0.96))] p-5 shadow-[0_24px_60px_-42px_rgba(5,150,105,0.2)] md:p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Shield className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                    Safe Submission
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Your review stays private
                  </h2>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3">
                  Faculty members cannot view this review from the student side.
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3">
                  Other students cannot see your course, comment, or rating here.
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3">
                  The review form is designed to feel confidential for students.
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(237,233,254,0.92),rgba(255,255,255,0.96))] p-5 shadow-[0_24px_60px_-42px_rgba(91,33,182,0.18)] md:p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <UsersRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
                    Best Review Style
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Keep it useful
                  </h2>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                {[
                  "Mention whether explanations are clear or confusing.",
                  "Point out how doubts are handled in real class situations.",
                  "Add one strong point and one improvement point if possible.",
                  "Use respectful language so admin can act on it clearly.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600" />
                      <span>{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
