"use client";

import Link from "next/link";

function getAccentStyles(accent) {
  if (accent === "amber") {
    return {
      shell: "from-amber-50 via-white to-yellow-50",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      button: "bg-amber-500 hover:bg-amber-600",
      glow: "from-amber-200/60 to-yellow-200/30",
      panel: "border-amber-100 bg-white/90",
    };
  }

  if (accent === "emerald") {
    return {
      shell: "from-emerald-50 via-white to-teal-50",
      border: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
      button: "bg-emerald-500 hover:bg-emerald-600",
      glow: "from-emerald-200/60 to-teal-200/30",
      panel: "border-emerald-100 bg-white/90",
    };
  }

  if (accent === "violet") {
    return {
      shell: "from-violet-50 via-white to-fuchsia-50",
      border: "border-violet-200",
      badge: "bg-violet-100 text-violet-700",
      button: "bg-violet-500 hover:bg-violet-600",
      glow: "from-violet-200/60 to-fuchsia-200/30",
      panel: "border-violet-100 bg-white/90",
    };
  }

  return {
    shell: "from-blue-50 via-white to-indigo-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    button: "bg-blue-600 hover:bg-blue-700",
    glow: "from-blue-200/60 to-indigo-200/30",
    panel: "border-blue-100 bg-white/90",
  };
}

export default function StudentComingSoonPage({
  title,
  description,
  accent = "blue",
}) {
  const styles = getAccentStyles(accent);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${styles.shell} px-4 py-6 md:px-6`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border border-white/80 bg-white/75 px-5 py-5 shadow-sm backdrop-blur md:px-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
            Student Panel
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
                This section is being carefully built for students.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-gray-600 md:text-base">
                A polished version of the {title.toLowerCase()} module is on
                the way with real student data and a cleaner experience.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm">
                  Real data hookup pending
                </span>
                <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm">
                  Student-friendly UI in progress
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/student"
                  className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${styles.button}`}
                >
                  Back to Dashboard
                </Link>
                <Link
                  href="/dashboard/student/attendance"
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
                    <defs>
                      <linearGradient
                        id="studentSceneBg"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#eff6ff" />
                        <stop offset="100%" stopColor="#dbeafe" />
                      </linearGradient>
                      <linearGradient
                        id="screenGlow"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#dcfce7" />
                        <stop offset="100%" stopColor="#bfdbfe" />
                      </linearGradient>
                    </defs>

                    <ellipse
                      cx="230"
                      cy="265"
                      rx="130"
                      ry="18"
                      fill="rgba(15,23,42,0.08)"
                    />

                    <rect
                      x="58"
                      y="34"
                      width="344"
                      height="196"
                      rx="28"
                      fill="url(#studentSceneBg)"
                    />

                    <rect
                      x="84"
                      y="60"
                      width="124"
                      height="88"
                      rx="18"
                      fill="#ffffff"
                    />
                    <rect
                      x="98"
                      y="74"
                      width="96"
                      height="12"
                      rx="6"
                      fill="#dbeafe"
                    />
                    <rect
                      x="98"
                      y="98"
                      width="74"
                      height="10"
                      rx="5"
                      fill="#e5e7eb"
                    />
                    <rect
                      x="98"
                      y="118"
                      width="86"
                      height="10"
                      rx="5"
                      fill="#e5e7eb"
                    />

                    <rect
                      x="245"
                      y="82"
                      width="112"
                      height="74"
                      rx="12"
                      fill="#1e3a8a"
                    />
                    <rect
                      x="252"
                      y="89"
                      width="98"
                      height="60"
                      rx="10"
                      fill="url(#screenGlow)"
                    />
                    <rect
                      x="274"
                      y="170"
                      width="54"
                      height="8"
                      rx="4"
                      fill="#64748b"
                    />
                    <rect
                      x="294"
                      y="154"
                      width="14"
                      height="18"
                      rx="6"
                      fill="#94a3b8"
                    />

                    <rect
                      x="190"
                      y="162"
                      width="96"
                      height="12"
                      rx="6"
                      fill="#334155"
                    />
                    <path
                      d="M170 174h122l20 44H150l20-44Z"
                      fill="#0f172a"
                    />
                    <rect
                      x="198"
                      y="166"
                      width="80"
                      height="6"
                      rx="3"
                      fill="#93c5fd"
                    />

                    <circle cx="126" cy="180" r="28" fill="#f8c9a3" />
                    <path
                      d="M104 173c3-20 17-33 33-33 11 0 20 6 26 14-15-1-30 3-43 12-5 3-10 5-16 7Z"
                      fill="#1f2937"
                    />
                    <circle cx="116" cy="182" r="4.5" fill="#0f172a" />
                    <path
                      d="M122 194c5 4 12 4 18 0"
                      fill="none"
                      stroke="#7c2d12"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    <path
                      d="M103 211c10-13 37-13 48 0l10 36h-68l10-36Z"
                      fill="#2563eb"
                    />
                    <path
                      d="M103 212c7 8 15 15 27 18 8-3 15-9 21-16"
                      fill="none"
                      stroke="#eff6ff"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M152 218l30-20c8-5 18 2 16 11-1 4-3 7-8 9l-33 15"
                      fill="#f8c9a3"
                    />
                    <path
                      d="M104 216l-15 23"
                      fill="none"
                      stroke="#f8c9a3"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M90 239l-24-1"
                      fill="none"
                      stroke="#f8c9a3"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />

                    <path
                      d="M114 246h18l10 32h-18l-10-32Z"
                      fill="#1e293b"
                    />
                    <path
                      d="M146 246h18l6 32h-18l-6-32Z"
                      fill="#0f172a"
                    />

                    <path
                      d="M112 278h30"
                      fill="none"
                      stroke="#111827"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M151 278h28"
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
                        We are polishing the student experience here.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
                    >
                      In progress
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`working-bar h-full rounded-full ${styles.button.split(
                        " "
                      )[0]}`}
                    />
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
          width: 62%;
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
