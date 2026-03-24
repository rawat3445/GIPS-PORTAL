import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

const HIGHLIGHTS = [
  {
    title: "Live Attendance Tracking",
    description:
      "Monitor classes, monthly percentages, holidays, and internship days in one place.",
  },
  {
    title: "Role-Based Dashboards",
    description:
      "Students, faculty, and admins land directly inside their own focused workspace.",
  },
  {
    title: "Academic Workflow",
    description:
      "Assignments, results, schedules, and campus notices stay organized under one portal.",
  },
];

const QUICK_STATS = [
  { label: "Campus Workspaces", value: "3" },
  { label: "Smart Attendance Window", value: "2026+" },
  { label: "Secure Role Login", value: "24/7" },
];

export default async function Home() {
  let token;

  try {
    const cookieStore = await cookies();
    token = cookieStore.get?.("token")?.value;
  } catch (err) {
    console.error("Cookie read failed:", err);
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.role === "admin") return redirect("/dashboard/admin");
      if (payload.role === "faculty") return redirect("/dashboard/faculty");
      if (payload.role === "student") return redirect("/dashboard/student");
    } catch (err) {
      console.error("Token invalid:", err);
    }
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-900"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-sky-200/50 blur-3xl"
          style={{ animation: "floatBlob 14s ease-in-out infinite" }}
        />
        <div
          className="absolute right-[-4rem] top-0 h-80 w-80 rounded-full bg-cyan-200/45 blur-3xl"
          style={{ animation: "floatBlob 18s ease-in-out infinite 1.5s" }}
        />
        <div
          className="absolute bottom-[-5rem] left-1/3 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl"
          style={{ animation: "floatBlob 16s ease-in-out infinite 0.75s" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:88px_88px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between rounded-full border border-white/80 bg-white/70 px-4 py-3 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-sky-100 bg-white shadow-sm">
              <Image
                src="/collage_logo.png"
                alt="College logo"
                fill
                className="object-contain p-1.5"
                priority
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                GIPS Portal
              </p>
              <p className="text-sm font-medium text-slate-600">
                Garhwal Institute of Paramedical Sciences
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="#highlights"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Highlights
            </a>
            <Link
              href="/login"
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Login
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 lg:grid-cols-[1.2fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(150deg,rgba(255,255,255,0.96),rgba(239,246,255,0.94),rgba(236,253,245,0.84))] px-6 py-8 shadow-[0_40px_90px_-52px_rgba(15,23,42,0.45)] backdrop-blur sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0f172a,#0ea5e9,#22c55e,#f59e0b)]" />
            <div className="max-w-3xl">
              <div
                className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm"
                style={{ animation: "liftIn 0.8s ease-out both" }}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Welcome to the Digital Campus
              </div>

              <h1
                className="mt-6 text-4xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl"
                style={{
                  animation: "liftIn 0.9s ease-out both 0.08s",
                  fontFamily: "var(--font-display)",
                }}
              >
                A smarter home for attendance, academics, and everyday campus flow.
              </h1>

              <p
                className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg"
                style={{ animation: "liftIn 0.95s ease-out both 0.16s" }}
              >
                Step into a polished college workspace where students stay on top
                of attendance, faculty manage daily operations smoothly, and
                administrators oversee the entire academic system with clarity.
              </p>

              <div
                className="mt-8 flex flex-col gap-3 sm:flex-row"
                style={{ animation: "liftIn 1s ease-out both 0.24s" }}
              >
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#2563eb,#14b8a6)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_20px_45px_-18px_rgba(14,165,233,0.65)] transition duration-300 hover:-translate-y-1 hover:brightness-110"
                  style={{ animation: "ctaPulse 2.8s ease-in-out infinite" }}
                >
                  Login to Dashboard
                </Link>
              </div>

              <div
                className="mt-10 grid gap-3 sm:grid-cols-3"
                style={{ animation: "liftIn 1.05s ease-out both 0.32s" }}
              >
                {QUICK_STATS.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/90 bg-white/70 px-4 py-4 shadow-sm backdrop-blur"
                  >
                    <p className="text-2xl font-black tracking-tight text-slate-950">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div
              className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-slate-950 px-6 py-7 text-white shadow-[0_32px_80px_-48px_rgba(2,6,23,0.9)]"
              style={{ animation: "liftIn 0.95s ease-out both 0.22s" }}
            >
              <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="relative">
                <div className="mb-5 flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur">
                    <Image
                      src="/collage_logo.png"
                      alt="College logo"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
                      Campus Access
                    </p>
                    <h2
                      className="mt-1 text-2xl font-bold"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      One portal, every role.
                    </h2>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {[
                    {
                      label: "Students",
                      text: "Attendance, assignments, results, and daily updates.",
                    },
                    {
                      label: "Faculty",
                      text: "Mark attendance, review students, and manage course events.",
                    },
                    {
                      label: "Admin",
                      text: "Monitor people, attendance insights, and academic operations.",
                    },
                  ].map((item, index) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"
                      style={{
                        animation: `liftIn 0.95s ease-out both ${0.3 + index * 0.08}s`,
                      }}
                    >
                      <p className="text-sm font-semibold text-cyan-200">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              id="highlights"
              className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"
              style={{ animation: "liftIn 1s ease-out both 0.34s" }}
            >
              {HIGHLIGHTS.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-[26px] border border-white/85 bg-white/85 p-5 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.4)] backdrop-blur"
                  style={{
                    animation: `liftIn 1s ease-out both ${0.38 + index * 0.08}s`,
                  }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-400 text-sm font-black text-white shadow-lg shadow-sky-400/20">
                    {index + 1}
                  </div>
                  <h3
                    className="text-lg font-bold text-slate-900"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-8 flex flex-col gap-3 border-t border-white/70 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Built for a smoother campus experience across students, faculty, and admin.</p>
          <p>Need support? Contact the college IT department.</p>
        </footer>
      </div>
    </main>
  );
}
