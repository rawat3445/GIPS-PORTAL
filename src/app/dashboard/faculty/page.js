"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  GraduationCap,
  PlusCircle,
  Sparkles,
} from "lucide-react";

const COURSES = [
  { name: "Bachelor of Physiotherapy", code: "BPT" },
  { name: "Bachelor of Optometry", code: "BOPTOM" },
  { name: "Medical Radiology & Imaging", code: "BMRIT" },
  { name: "Diploma in Optometry", code: "DOPTOM" },
  { name: "Operation Theater Technology", code: "BOTT" },
];

const AUTO_REDIRECT_TO_COURSE = false;

function FacultyAssistant({ faculty, course }) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-700">
        <Sparkles className="h-3.5 w-3.5" />
        Faculty Guide
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-950">
        Hello, {faculty?.name || "Faculty"}.
      </p>
      <p className="mt-2 text-sm leading-7 text-gray-600">
        Your workspace is ready for {course?.code || "your assigned course"}.
        You can jump into attendance right away or open the full course view to
        manage students.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
          <BookOpen className="h-4 w-4" />
          {course?.code || "No Course"}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <CalendarCheck2 className="h-4 w-4" />
          Attendance ready
        </span>
      </div>
    </div>
  );
}

export default function FacultyDashboard() {
  const router = useRouter();
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Not authenticated");

        setFaculty(data.user);
      } catch (err) {
        setError(err.message || "Auth error");
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  const assigned = String(faculty?.assignedCourse || "").toUpperCase();

  const myCourse = useMemo(() => {
    return COURSES.find((c) => c.code === assigned) || null;
  }, [assigned]);

  useEffect(() => {
    if (!AUTO_REDIRECT_TO_COURSE) return;
    if (!loading && myCourse?.code) {
      router.replace(`/dashboard/faculty/${myCourse.code}`);
    }
  }, [loading, myCourse, router]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-600">Loading faculty dashboard...</div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!myCourse) {
    return (
      <div className="p-6">
        <p className="font-medium text-red-600">Course not assigned.</p>
        <p className="mt-1 text-sm text-gray-600">
          Please ask admin to assign a course to your faculty account.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e0e7ff_0%,#eef2ff_24%,#f8fafc_58%,#f8fafc_100%)]">
      <div className="border-b border-white/70 bg-[radial-gradient(circle_at_top_left,#eef2ff_0%,#ffffff_48%,#e0e7ff_100%)] px-4 py-6 md:px-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-indigo-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Faculty Dashboard
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              Welcome back, {faculty?.name || "Faculty"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
              Your teaching workspace is focused around the course you manage,
              so the key actions stay fast and easy to reach.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                <GraduationCap className="h-4 w-4 text-indigo-600" />
                {myCourse.code}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                <BookOpen className="h-4 w-4 text-violet-600" />
                {myCourse.name}
              </span>
            </div>
          </div>

          <FacultyAssistant faculty={faculty} course={myCourse} />
        </div>
      </div>

      <div className="space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.38)]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <BookOpen className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-gray-500">Assigned Course</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{myCourse.code}</p>
            <p className="mt-2 text-sm text-gray-600">{myCourse.name}</p>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.38)]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CalendarCheck2 className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-gray-500">Attendance Flow</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">Ready</p>
            <p className="mt-2 text-sm text-gray-600">
              Start marking attendance for your assigned course.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.38)]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <PlusCircle className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-gray-500">Student Access</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">Manage</p>
            <p className="mt-2 text-sm text-gray-600">
              Open your course and add students when needed.
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(238,242,255,0.92),rgba(224,231,255,0.86))] p-6 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.42)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">
                My Course
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">
                {myCourse.name}
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                Use your course workspace to manage students, review attendance,
                and keep everything organized around one program.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/dashboard/faculty/${encodeURIComponent(myCourse.code)}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Open Course
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href={`/dashboard/faculty/${encodeURIComponent(myCourse.code)}/add-student`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
              >
                <PlusCircle className="h-4 w-4" />
                Add Student
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
