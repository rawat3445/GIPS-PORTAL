"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";

export default function StudentLayoutClient({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  const primaryMenuItems = [
    {
      name: "Dashboard",
      href: "/dashboard/student",
      icon: LayoutDashboard,
    },
    {
      name: "Attendance",
      href: "/dashboard/student/attendance",
      icon: CalendarDays,
    },
  ];

  const secondaryMenuItems = [
    {
      name: "My Courses",
      href: "/dashboard/student/courses",
      icon: BookOpen,
      badge: "Soon",
    },
    {
      name: "Assignments",
      href: "/dashboard/student/assignments",
      icon: ClipboardList,
      badge: "Soon",
    },
    {
      name: "Results",
      href: "/dashboard/student/results",
      icon: BarChart3,
      badge: "Soon",
    },
    {
      name: "Fees",
      href: "/dashboard/student/fees",
      icon: CreditCard,
      badge: "Soon",
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;

        setMe(data.user || null);
      } catch {
        setMe(null);
      }
    }

    loadMe();
  }, []);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const studentSubText = [
    me?.enrollmentNo || "",
    me?.course || "",
    me?.year ? `Year ${me.year}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#e2e8f0_38%,#f8fafc_100%)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-x-hidden border-r border-white/10 bg-[linear-gradient(180deg,#0f172a_0%,#1d4ed8_52%,#0f172a_100%)] text-white shadow-[24px_0_80px_-42px_rgba(15,23,42,0.9)] transition-all duration-300 md:static md:z-auto ${
          sidebarOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full w-64 md:translate-x-0 md:w-24"
        }`}
      >
        {/* Logo */}
        <div className="border-b border-white/10 p-4">
          <div
            className={`flex items-center ${
              sidebarOpen ? "justify-between" : "justify-center"
            }`}
          >
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 shadow-inner shadow-white/10">
                    <GraduationCap className="h-5 w-5 text-cyan-200" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-bold">Student Portal</h1>
                    <p className="mt-0.5 text-xs text-blue-100/75">
                      GIPS dashboard
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 transition hover:bg-white/14"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {sidebarOpen && (
            <p className="mb-3 px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
              Main
            </p>
          )}

          <div className="space-y-2">
            {primaryMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`group relative flex items-center rounded-2xl py-3 transition ${
                    isActive
                      ? "bg-white text-slate-900 shadow-[0_16px_35px_-18px_rgba(255,255,255,0.7)]"
                      : "text-blue-50/90 hover:bg-white/10 hover:text-white"
                  } ${
                    sidebarOpen
                      ? "gap-3 px-4 justify-start"
                      : "justify-center px-2"
                  }`}
                >
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "bg-white/8 text-cyan-100 group-hover:bg-white/14"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  {sidebarOpen && (
                    <span className="font-medium truncate">{item.name}</span>
                  )}
                  {!sidebarOpen && <span className="sr-only">{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {sidebarOpen && (
            <div className="mb-3 mt-6 flex items-center justify-between px-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-200/80">
                Working On It
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Soon
              </span>
            </div>
          )}

          <div className="space-y-2">
            {secondaryMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`group flex items-center rounded-2xl border py-3 transition ${
                    isActive
                      ? "border-white/25 bg-white/12 text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.9)]"
                      : "border-white/10 bg-white/5 text-blue-100/85 hover:border-white/20 hover:bg-white/9 hover:text-white"
                  } ${
                    sidebarOpen
                      ? "gap-3 px-4 justify-start"
                      : "justify-center px-2"
                  }`}
                >
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      isActive
                        ? "bg-white/12 text-white"
                        : "bg-white/7 text-blue-100 group-hover:bg-white/12"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  {sidebarOpen && (
                    <>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                            isActive
                              ? "bg-white/15 text-white"
                              : "bg-cyan-100 text-cyan-800"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {!sidebarOpen && <span className="sr-only">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-white/10 p-4">
          {sidebarOpen && (
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 shadow-inner shadow-white/5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/20 text-sm font-bold text-cyan-100">
                  {(me?.name || "S").charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {me?.name || "Student"}
                  </p>
                  <p className="mt-1 truncate text-xs text-blue-100/75">
                    {studentSubText || "Student profile"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex w-full items-center rounded-2xl border border-white/10 py-3 text-blue-50/90 transition hover:bg-red-500 hover:text-white ${
              sidebarOpen ? "gap-3 px-4 justify-start" : "justify-center px-2"
            }`}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <LogOut className="h-5 w-5 shrink-0" />
            </span>
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 overflow-y-auto md:ml-0">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200/80 bg-white text-gray-700 shadow-sm"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Student Portal</p>
            <p className="truncate text-xs text-gray-500">
              {me?.name || "Student"}
            </p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
