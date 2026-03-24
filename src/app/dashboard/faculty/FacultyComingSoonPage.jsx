"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

function getAccentStyles(accent) {
  if (accent === "emerald") {
    return {
      shell: "from-emerald-50 via-white to-teal-50",
      border: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
      button: "bg-emerald-600 hover:bg-emerald-700",
      glow: "from-emerald-200/60 to-teal-200/30",
      panel: "border-emerald-100 bg-white/90",
    };
  }

  return {
    shell: "from-indigo-50 via-white to-violet-50",
    border: "border-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
    button: "bg-indigo-600 hover:bg-indigo-700",
    glow: "from-indigo-200/60 to-violet-200/30",
    panel: "border-indigo-100 bg-white/90",
  };
}

export default function FacultyComingSoonPage({
  title,
  description,
  accent = "indigo",
}) {
  const styles = getAccentStyles(accent);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${styles.shell} px-4 py-6 md:px-6`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border border-white/80 bg-white/75 px-5 py-5 shadow-sm backdrop-blur md:px-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
            Faculty Panel
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            {description}
          </p>
        </div>

        <div
          className={`relative overflow-hidden rounded-[2rem] border bg-white/70 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur ${styles.border}`}
        >
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-r ${styles.glow}`}
          />

          <div className="relative grid gap-8 px-5 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-10">
            <div className="flex flex-col justify-center">
              <span
                className={`inline-flex w-fit rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] ${styles.badge}`}
              >
                Working On It
              </span>

              <h2 className="mt-5 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
                This faculty section is being carefully built.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-gray-600 md:text-base">
                We are redesigning the {title.toLowerCase()} workflow so it
                feels cleaner, more useful, and more reliable for faculty work.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm">
                  Real workflow in progress
                </span>
                <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm">
                  UI polish underway
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/faculty"
                  className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${styles.button}`}
                >
                  Back to Dashboard
                </Link>
                <Link
                  href="/dashboard/faculty/mark-attendance"
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                >
                  Open Attendance
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div
                className={`relative w-full max-w-[420px] rounded-[2rem] border p-5 shadow-[0_24px_55px_-34px_rgba(15,23,42,0.45)] ${styles.panel}`}
              >
                <div className="absolute left-8 top-6 flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-300" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-300" />
                </div>

                <div className="illustration-float mt-8">
                  <svg
                    viewBox="0 0 460 300"
                    className="mx-auto h-auto w-full max-w-[360px]"
                    aria-hidden="true"
                  >
                    <ellipse
                      cx="230"
                      cy="265"
                      rx="130"
                      ry="18"
                      fill="rgba(15,23,42,0.08)"
                    />

                    <rect
                      x="62"
                      y="38"
                      width="336"
                      height="188"
                      rx="28"
                      fill="#eef2ff"
                    />
                    <rect x="94" y="62" width="136" height="82" rx="16" fill="#ffffff" />
                    <rect x="108" y="76" width="86" height="12" rx="6" fill="#c7d2fe" />
                    <rect x="108" y="98" width="104" height="10" rx="5" fill="#e5e7eb" />
                    <rect x="108" y="118" width="76" height="10" rx="5" fill="#e5e7eb" />

                    <rect x="258" y="82" width="94" height="68" rx="12" fill="#312e81" />
                    <rect x="264" y="88" width="82" height="56" rx="10" fill="#bfdbfe" />
                    <rect x="286" y="160" width="38" height="8" rx="4" fill="#64748b" />
                    <rect x="298" y="146" width="14" height="16" rx="6" fill="#94a3b8" />

                    <circle cx="158" cy="172" r="28" fill="#f8c9a3" />
                    <path
                      d="M135 166c4-18 18-30 33-30 10 0 19 5 26 13-15 0-28 4-40 12-6 4-11 5-19 5Z"
                      fill="#1f2937"
                    />
                    <circle cx="149" cy="174" r="4.5" fill="#0f172a" />
                    <path
                      d="M155 186c5 4 12 4 18 0"
                      fill="none"
                      stroke="#7c2d12"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    <path
                      d="M133 204c12-13 41-13 54 0l11 42h-75l10-42Z"
                      fill="#4f46e5"
                    />
                    <path
                      d="M187 212l28-18c8-5 17 2 16 11-1 4-4 7-8 9l-31 13"
                      fill="#f8c9a3"
                    />
                    <path
                      d="M144 246h20l8 30h-19l-9-30Z"
                      fill="#1e293b"
                    />
                    <path
                      d="M176 246h20l6 30h-18l-8-30Z"
                      fill="#0f172a"
                    />
                    <path
                      d="M140 276h33"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M181 276h30"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Module progress
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Faculty workflow improvements are underway.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
                    >
                      In progress
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className={`working-bar h-full rounded-full ${styles.button.split(" ")[0]}`} />
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    Cleaner faculty tools coming soon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .illustration-float {
          animation: gentleFloat 3.4s ease-in-out infinite;
        }

        .working-bar {
          width: 64%;
          animation: progressPulse 1.9s ease-in-out infinite;
        }

        @keyframes gentleFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes progressPulse {
          0%,
          100% {
            transform: scaleX(0.95);
            opacity: 0.88;
          }
          50% {
            transform: scaleX(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
