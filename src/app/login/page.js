"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

/* ─── Portal feature cards ─────────────────────────────────────────── */
const portalHighlights = [
  {
    title: "Student Access",
    text: "Attendance, updates, and academic records in one place.",
    icon: Users,
    accent: "#f59e0b",
  },
  {
    title: "Faculty Tools",
    text: "Mark attendance, review students, and manage course flow.",
    icon: BookOpen,
    accent: "#34d399",
  },
  {
    title: "Secure Admin Control",
    text: "Protected sign-in for operations, reports, and dashboards.",
    icon: ShieldCheck,
    accent: "#60a5fa",
  },
];

/* ─── Animated starfield canvas ────────────────────────────────────── */
function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const STAR_COUNT = 120;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      alpha: Math.random(),
      speed: Math.random() * 0.004 + 0.002,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        const a = 0.18 + 0.55 * Math.abs(Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,220,130,${a})`;
        ctx.fill();
      });
      t++;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

/* ─── Animated orb blobs ────────────────────────────────────────────── */
function OrbField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-32 top-1/4 h-[480px] w-[480px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.7) 0%, transparent 70%)",
          animation: "orbDrift1 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-24 bottom-1/4 h-[380px] w-[380px] rounded-full opacity-15"
        style={{
          background:
            "radial-gradient(circle, rgba(52,211,153,0.6) 0%, transparent 70%)",
          animation: "orbDrift2 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(circle, rgba(96,165,250,0.7) 0%, transparent 70%)",
          animation: "orbDrift3 15s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* ─── Main Login Page ───────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // tiny delay so CSS animations feel choreographed
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      if (!data.redirectTo) {
        setError("Login succeeded, but redirect target is missing.");
        return;
      }

      router.replace(data.redirectTo);
    } catch (err) {
      console.error(err);
      setError("Something went wrong, try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div
        className="relative min-h-screen overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #060912 0%, #0a1020 45%, #0d0c14 100%)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Deep grid texture ── */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />

        <OrbField />

        {/* ── Main centered card ── */}
        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div
            className="grid w-full overflow-hidden lg:grid-cols-[1.1fr_0.9fr]"
            style={{
              borderRadius: "28px",
              border: "1px solid rgba(245,158,11,0.18)",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(24px)",
              boxShadow:
                "0 80px 160px -40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 1px 0 rgba(255,255,255,0.12) inset",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.8s ease, transform 0.8s ease",
            }}
          >
            {/* ════════════ LEFT PANEL ════════════ */}
            <section
              className="relative overflow-hidden px-8 py-10 lg:px-12 lg:py-14"
              style={{
                background:
                  "linear-gradient(155deg, rgba(8,8,18,0.95) 0%, rgba(12,22,14,0.95) 55%, rgba(18,10,6,0.92) 100%)",
                borderRight: "1px solid rgba(245,158,11,0.1)",
              }}
            >
              <StarField />

              {/* Subtle radial vignette */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 60% at 20% 30%, rgba(245,158,11,0.07) 0%, transparent 70%)",
                }}
              />

              {/* Decorative gold arc */}
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full"
                style={{
                  border: "1px solid rgba(245,158,11,0.12)",
                  animation: "spinSlow 30s linear infinite",
                }}
              />
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
                style={{
                  border: "1px solid rgba(245,158,11,0.08)",
                  animation: "spinSlow 20s linear infinite reverse",
                }}
              />

              <div className="relative">
                {/* Badge */}
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest"
                  style={{
                    borderRadius: "100px",
                    border: "1px solid rgba(245,158,11,0.3)",
                    background: "rgba(245,158,11,0.08)",
                    color: "#f59e0b",
                    animation: "fadeSlideUp 0.7s ease both",
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                  GIPS Academic Portal
                </div>

                {/* Logo + Institute name */}
                <div
                  className="mt-8 flex items-center gap-5"
                  style={{ animation: "fadeSlideUp 0.7s ease 0.12s both" }}
                >
                  <div
                    className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center"
                    style={{
                      borderRadius: "22px",
                      background:
                        "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      boxShadow: "0 0 32px rgba(245,158,11,0.12)",
                    }}
                  >
                    <Image
                      src="/collage_logo.png"
                      alt="GIPS college logo"
                      width={48}
                      height={48}
                      className="h-12 w-12 object-contain"
                      style={{
                        filter: "drop-shadow(0 0 12px rgba(245,158,11,0.4))",
                      }}
                      priority
                    />
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.3em]"
                      style={{ color: "rgba(245,158,11,0.75)" }}
                    >
                      Garhwal Institute of
                    </p>
                    <p
                      className="mt-1 font-semibold text-white"
                      style={{ fontSize: "1.05rem", letterSpacing: "0.02em" }}
                    >
                      Paramedical Sciences
                    </p>
                  </div>
                </div>

                {/* Headline */}
                <div
                  className="mt-10"
                  style={{ animation: "fadeSlideUp 0.7s ease 0.22s both" }}
                >
                  <h1
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "clamp(2.6rem, 4.5vw, 3.6rem)",
                      fontWeight: 600,
                      lineHeight: 1.08,
                      color: "#ffffff",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Your campus,
                    <br />
                    <span
                      style={{
                        background:
                          "linear-gradient(90deg, #f59e0b 0%, #fcd34d 50%, #f59e0b 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundSize: "200% auto",
                        animation: "shimmerText 4s linear infinite",
                      }}
                    >
                      elevated.
                    </span>
                  </h1>
                  <p
                    className="mt-5 max-w-sm text-sm leading-7"
                    style={{ color: "rgba(255,255,255,0.48)" }}
                  >
                    One welcoming portal for students, faculty, and admin — with
                    cleaner access to attendance, academic workflows, and daily
                    campus operations.
                  </p>
                </div>

                {/* Feature cards */}
                <div
                  className="mt-10 flex flex-col gap-3"
                  style={{ animation: "fadeSlideUp 0.7s ease 0.34s both" }}
                >
                  {portalHighlights.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-4 px-5 py-4 transition-transform duration-300 hover:-translate-y-0.5"
                        style={{
                          borderRadius: "18px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          animationDelay: `${0.46 + i * 0.1}s`,
                        }}
                      >
                        <span
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center"
                          style={{
                            borderRadius: "12px",
                            background: `${item.accent}18`,
                            border: `1px solid ${item.accent}35`,
                            color: item.accent,
                          }}
                        >
                          <Icon
                            className="h-4.5 w-4.5"
                            style={{ width: 18, height: 18 }}
                          />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <p
                            className="mt-0.5 text-xs leading-5"
                            style={{ color: "rgba(255,255,255,0.44)" }}
                          >
                            {item.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pill tags */}
                <div
                  className="mt-8 flex flex-wrap gap-2"
                  style={{ animation: "fadeSlideUp 0.7s ease 0.78s both" }}
                >
                  {[
                    "Secure login",
                    "Attendance ready",
                    "Role-based access",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium"
                      style={{
                        padding: "5px 14px",
                        borderRadius: "100px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* ════════════ RIGHT PANEL ════════════ */}
            <section
              className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14"
              style={{
                background:
                  "linear-gradient(165deg, rgba(10,10,22,0.97) 0%, rgba(8,12,20,0.98) 100%)",
              }}
            >
              {/* Radial top glow */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-48"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.1) 0%, transparent 70%)",
                }}
              />

              <div
                className="relative mx-auto w-full max-w-md"
                style={{ animation: "fadeSlideUp 0.7s ease 0.28s both" }}
              >
                {/* Header */}
                <div className="mb-9">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest"
                    style={{
                      borderRadius: "100px",
                      border: "1px solid rgba(52,211,153,0.25)",
                      background: "rgba(52,211,153,0.08)",
                      color: "#34d399",
                    }}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Secure Sign In
                  </div>
                  <h2
                    className="mt-5"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                      fontWeight: 600,
                      color: "#ffffff",
                      lineHeight: 1.12,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Welcome back
                  </h2>
                  <p
                    className="mt-3 text-sm leading-6"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Enter your credentials to access your student, faculty, or
                    admin workspace.
                  </p>
                </div>

                {/* Form glass card */}
                <div
                  className="relative p-6 sm:p-8"
                  style={{
                    borderRadius: "24px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow:
                      "0 40px 80px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
                  }}
                >
                  {/* shimmer sweep */}
                  <div
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    style={{ borderRadius: "24px" }}
                  >
                    <div
                      className="absolute inset-y-0"
                      style={{
                        width: "40%",
                        left: "-40%",
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
                        animation: "formShimmer 7s ease-in-out infinite",
                      }}
                    />
                  </div>

                  <form onSubmit={handleSubmit} className="relative space-y-5">
                    {error && (
                      <div
                        className="rounded-2xl px-4 py-3 text-sm font-medium"
                        style={{
                          border: "1px solid rgba(239,68,68,0.3)",
                          background: "rgba(239,68,68,0.1)",
                          color: "#fca5a5",
                        }}
                      >
                        {error}
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label
                        className="mb-2 block text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        Email Address or Enrollment No.
                      </label>
                      <div
                        className="group flex items-center gap-3 px-4 py-3.5 transition-all duration-200 focus-within:scale-[1.01]"
                        style={{
                          borderRadius: "14px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(255,255,255,0.05)",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor =
                            "rgba(245,158,11,0.5)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.1)")
                        }
                      >
                        <Mail
                          className="h-4 w-4 shrink-0 transition-colors group-focus-within:text-amber-400"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        />
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com or 6189001"
                          required
                          className="w-full bg-transparent text-sm placeholder:text-white/25 focus:outline-none"
                          style={{ color: "rgba(255,255,255,0.9)" }}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        className="mb-2 block text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        Password
                      </label>
                      <div
                        className="group flex items-center gap-3 px-4 py-3.5 transition-all duration-200 focus-within:scale-[1.01]"
                        style={{
                          borderRadius: "14px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(255,255,255,0.05)",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor =
                            "rgba(52,211,153,0.5)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.1)")
                        }
                      >
                        <Lock
                          className="h-4 w-4 shrink-0 transition-colors group-focus-within:text-emerald-400"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="w-full bg-transparent text-sm placeholder:text-white/25 focus:outline-none"
                          style={{ color: "rgba(255,255,255,0.9)" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="shrink-0 transition-opacity hover:opacity-80"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="group relative w-full overflow-hidden py-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-18px_rgba(245,158,11,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        borderRadius: "14px",
                        background:
                          "linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)",
                        border: "1px solid rgba(245,158,11,0.35)",
                        boxShadow: "0 8px 24px -8px rgba(245,158,11,0.35)",
                        marginTop: "28px",
                      }}
                    >
                      {/* hover shimmer */}
                      <span
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.15) 50%, transparent 80%)",
                          animation: "btnShimmer 1.6s ease-in-out infinite",
                        }}
                      />
                      <span className="relative flex items-center justify-center gap-2">
                        {submitting ? (
                          <>
                            <svg
                              className="h-4 w-4 animate-spin"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                              />
                            </svg>
                            Signing In…
                          </>
                        ) : (
                          <>
                            Enter Portal
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                </div>

                {/* Bottom info strips */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Access",
                      value: "Every campus role",
                      accent: "#f59e0b",
                    },
                    {
                      label: "Experience",
                      value: "Premium dashboard flow",
                      accent: "#34d399",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-4"
                      style={{
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: item.accent, opacity: 0.8 }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="mt-1.5 text-xs font-medium leading-5"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmerText {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        @keyframes formShimmer {
          0% {
            left: -40%;
          }
          60% {
            left: 140%;
          }
          100% {
            left: 140%;
          }
        }
        @keyframes btnShimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        @keyframes orbDrift1 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(40px, -60px) scale(1.08);
          }
        }
        @keyframes orbDrift2 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-50px, 40px) scale(1.06);
          }
        }
        @keyframes orbDrift3 {
          0%,
          100% {
            transform: translateX(-50%) scale(1);
          }
          50% {
            transform: translateX(-50%) translateY(30px) scale(1.05);
          }
        }
        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
