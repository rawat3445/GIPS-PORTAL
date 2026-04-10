"use client";

import { useState } from "react";
import { Gauge, MessageSquare, Send, Star } from "lucide-react";

const FEEDBACK_TYPE_OPTIONS = [
  { value: "general", label: "General feedback" },
  { value: "bug", label: "Bug report" },
  { value: "performance", label: "Performance issue" },
  { value: "feature", label: "Feature request" },
];

const RATING_OPTIONS = [1, 2, 3, 4, 5];

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white ${props.className || ""}`}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white ${props.className || ""}`}
    />
  );
}

export default function StudentFeedbackPage() {
  const [form, setForm] = useState({
    feedbackType: "general",
    experienceRating: "4",
    performanceRating: "4",
    title: "",
    message: "",
  });
  const [submitState, setSubmitState] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitState("submitting");
      setSubmitMessage("");

      const res = await fetch("/api/student/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to submit feedback");
      }

      setSubmitState("success");
      setSubmitMessage(
        data?.message || "Feedback submitted successfully.",
      );
      setForm((current) => ({
        ...current,
        title: "",
        message: "",
      }));
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error.message || "Unable to submit feedback");
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eef2ff_0%,#eff6ff_24%,#f8fafc_60%,#f8fafc_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.96),rgba(224,231,255,0.88))] p-5 shadow-[0_30px_70px_-48px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700 shadow-sm">
                <MessageSquare className="h-3.5 w-3.5" />
                Portal Feedback
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Share feedback about the portal and its performance
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                Tell us what is working well, what feels slow, and what should be
                improved. Short, clear feedback helps us improve the portal
                faster.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Best Use
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Bugs, speed, and suggestions
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Use this page for portal issues, performance complaints, or
                  ideas that would improve the student experience.
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Good Feedback
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Clear and specific notes help
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Mention what feels wrong, where it happens, and what should
                  improve.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(300px,0.75fr)]">
          <section className="rounded-[30px] border border-white/80 bg-white/94 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] md:p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Feedback Form
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Submit your portal feedback
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A short, specific report helps the portal improve faster.
              </p>
            </div>

            {submitMessage ? (
              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
                  submitState === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {submitMessage}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Feedback Type">
                  <select
                    value={form.feedbackType}
                    onChange={(e) => updateField("feedbackType", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
                  >
                    {FEEDBACK_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Portal Experience Rating">
                  <select
                    value={form.experienceRating}
                    onChange={(e) =>
                      updateField("experienceRating", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
                  >
                    {RATING_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} / 5
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Performance Rating">
                  <select
                    value={form.performanceRating}
                    onChange={(e) =>
                      updateField("performanceRating", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
                  >
                    {RATING_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} / 5
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field
                label="Short Title"
                hint="Optional. Example: Attendance page loads slowly on mobile."
              >
                <Input
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  maxLength={160}
                  placeholder="Give your feedback a short title"
                />
              </Field>

              <Field
                label="Feedback Message"
                hint="Tell what happened, where it happened, and what should improve."
              >
                <Textarea
                  rows={8}
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  maxLength={2000}
                  placeholder="Example: The student points page opens slowly after login, and the leaderboard takes too much time to load. It would help if the page became lighter or loaded section by section."
                />
              </Field>

              <button
                type="submit"
                disabled={submitState === "submitting"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                <Send className="h-4 w-4" />
                {submitState === "submitting"
                  ? "Submitting..."
                  : "Submit Feedback"}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(254,249,195,0.92),rgba(255,255,255,0.96))] p-5 shadow-[0_24px_60px_-42px_rgba(217,119,6,0.22)] md:p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Gauge className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                    Helpful Feedback
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    What to include
                  </h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "Which page felt slow or broken",
                  "What you expected to happen",
                  "What actually happened",
                  "Whether the issue repeats often",
                  "What change would help most",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(237,233,254,0.92),rgba(255,255,255,0.96))] p-5 shadow-[0_24px_60px_-42px_rgba(91,33,182,0.18)] md:p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Star className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
                    Quick Tip
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">
                    Feature ideas are welcome too
                  </h2>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                This form is not only for errors. Students can also suggest better
                navigation, clearer pages, faster loading, or new academic tools.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
