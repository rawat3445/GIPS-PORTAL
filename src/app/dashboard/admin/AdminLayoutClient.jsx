"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { trackDashboardPageView } from "../../lib/activityClient";

function NavLink({
  href,
  icon: Icon,
  label,
  isActive,
  sidebarOpen,
  onNavigate,
  nested = false,
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group relative flex items-center rounded-2xl py-3 transition ${
        isActive
          ? "bg-white text-slate-900 shadow-[0_16px_35px_-18px_rgba(255,255,255,0.7)]"
          : "text-amber-50/90 hover:bg-white/10 hover:text-white"
      } ${
        sidebarOpen
          ? `${nested ? "ml-4 gap-3 px-4" : "gap-3 px-4"} justify-start`
          : "justify-center px-2"
      }`}
    >
      <span
        className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${
          isActive
            ? "bg-amber-100 text-amber-700"
            : "bg-white/8 text-amber-100 group-hover:bg-white/14"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      {sidebarOpen && <span className="truncate font-medium">{label}</span>}
      {!sidebarOpen && <span className="sr-only">{label}</span>}
    </Link>
  );
}

export default function AdminLayoutClient({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentFacultyType =
    searchParams.get("type") === "nonTeaching" ? "nonTeaching" : "teaching";
  const searchKey = searchParams.toString();

  const directItems = [
    {
      name: "Dashboard",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard/admin",
    },
    {
      name: "Statistics",
      href: "/dashboard/admin/stats",
      icon: BarChart3,
      isActive: pathname === "/dashboard/admin/stats",
    },
    {
      name: "Students",
      href: "/dashboard/admin/students",
      icon: Users,
      isActive: pathname === "/dashboard/admin/students",
    },
    {
      name: "Admins",
      href: "/dashboard/admin/admins",
      icon: ShieldCheck,
      isActive: pathname.startsWith("/dashboard/admin/admins"),
    },
    {
      name: "Activity Logs",
      href: "/dashboard/admin/activity-logs",
      icon: Activity,
      isActive: pathname.startsWith("/dashboard/admin/activity-logs"),
    },
    {
      name: "Faculty Activity",
      href: "/dashboard/admin/faculty-activity",
      icon: GraduationCap,
      isActive: pathname.startsWith("/dashboard/admin/faculty-activity"),
    },
    {
      name: "Course Catalog",
      href: "/dashboard/admin/course-catalog",
      icon: BookOpen,
      isActive: pathname.startsWith("/dashboard/admin/course-catalog"),
    },
    {
      name: "Results",
      href: "/dashboard/admin/results",
      icon: BookOpen,
      isActive: pathname.startsWith("/dashboard/admin/results"),
    },
    {
      name: "Class Tests",
      href: "/dashboard/admin/class-tests",
      icon: Target,
      isActive: pathname.startsWith("/dashboard/admin/class-tests"),
    },
    {
      name: "Messages",
      href: "/dashboard/admin/messages",
      icon: BellRing,
      isActive: pathname.startsWith("/dashboard/admin/messages"),
    },
  ];

  const groupedItems = [
    {
      label: "Attendance",
      items: [
        {
          name: "Student Attendance",
          href: "/dashboard/admin/attendance",
          icon: CalendarDays,
          isActive:
            pathname === "/dashboard/admin/attendance" ||
            pathname === "/dashboard/admin/attendance/pending",
        },
        {
          name: "Pending Approval",
          href: "/dashboard/admin/attendance/pending",
          icon: Activity,
          isActive: pathname === "/dashboard/admin/attendance/pending",
        },
        {
          name: "Faculty Attendance",
          href: "/dashboard/admin/attendance/faculty",
          icon: CalendarDays,
          isActive: pathname === "/dashboard/admin/attendance/faculty",
        },
      ],
    },
    {
      label: "Faculty",
      items: [
        {
          name: "Teaching Faculty",
          href: "/dashboard/admin/faculty?type=teaching",
          icon: GraduationCap,
          isActive:
            pathname === "/dashboard/admin/faculty" &&
            currentFacultyType === "teaching",
        },
        {
          name: "Non-Teaching Faculty",
          href: "/dashboard/admin/faculty?type=nonTeaching",
          icon: BriefcaseBusiness,
          isActive:
            pathname === "/dashboard/admin/faculty" &&
            currentFacultyType === "nonTeaching",
        },
      ],
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

  useEffect(() => {
    trackDashboardPageView({
      userId: me?._id,
      pathname: searchKey ? `${pathname}?${searchKey}` : pathname,
    });
  }, [me?._id, pathname, searchKey]);

  const handleNavigate = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fff7ed_28%,#f8fafc_62%,#f8fafc_100%)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-x-hidden border-r border-white/10 bg-[linear-gradient(180deg,#3f1d12_0%,#b45309_42%,#111827_100%)] text-white shadow-[24px_0_80px_-42px_rgba(15,23,42,0.9)] transition-all duration-300 md:static md:z-auto ${
          sidebarOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full w-72 md:translate-x-0 md:w-24"
        }`}
      >
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
                    <ShieldCheck className="h-5 w-5 text-amber-200" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-bold">Admin Panel</h1>
                    <p className="mt-0.5 text-xs text-amber-100/75">
                      College control center
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

        <nav className="flex-1 overflow-y-auto p-4">
          {sidebarOpen && (
            <div className="mb-3 flex items-center justify-between px-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/75">
                Admin Tools
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                Live
              </span>
            </div>
          )}

          <div className="space-y-2">
            {directItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.name}
                isActive={item.isActive}
                sidebarOpen={sidebarOpen}
                onNavigate={handleNavigate}
              />
            ))}

            {groupedItems.map((group) => (
              <div key={group.label} className="space-y-2">
                {sidebarOpen && (
                  <p className="px-4 pt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/70">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.name}
                    isActive={item.isActive}
                    sidebarOpen={sidebarOpen}
                    onNavigate={handleNavigate}
                    nested={sidebarOpen}
                  />
                ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          {sidebarOpen && (
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 shadow-inner shadow-white/5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/20 text-sm font-bold text-amber-100">
                  {(me?.name || "A").charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {me?.name || "Admin User"}
                  </p>
                  <p className="mt-1 truncate text-xs text-amber-100/75">
                    {me?.email || "Administrator"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`flex w-full items-center rounded-2xl border border-white/10 py-3 text-amber-50/90 transition hover:bg-red-500 hover:text-white ${
              sidebarOpen ? "gap-3 px-4 justify-start" : "justify-center px-2"
            }`}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <LogOut className="h-5 w-5 flex-shrink-0" />
            </span>
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
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
            <p className="text-sm font-semibold text-gray-900">Admin Panel</p>
            <p className="truncate text-xs text-gray-500">
              {me?.name || "Admin User"}
            </p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
