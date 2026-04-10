"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Megaphone,
  PlayCircle,
  Users,
} from "lucide-react";
import {
  RESOURCE_TYPE_OPTIONS,
  getCourseName,
} from "../../../lib/courseCatalog";
import StudentComingSoonPage from "../StudentComingSoonPage";

const QUICK_LINKS = [
  { href: "/dashboard/student/attendance", label: "Attendance", icon: CalendarDays },
  { href: "/dashboard/student/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/dashboard/student/results", label: "Results", icon: BookOpen },
  { href: "/dashboard/student/fees", label: "Fees", icon: CreditCard },
];

function formatDateTime(value) {
  if (!value) return "Not published yet";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTypeLabel(type) {
  return (
    RESOURCE_TYPE_OPTIONS.find((option) => option.value === type)?.label || "Note"
  );
}

function getTypeIcon(type) {
  if (type === "video") return PlayCircle;
  return FileText;
}

function buildMaterialActionHref(material, { download = false } = {}) {
  const uploadedPublicId = String(material?.resourcePublicId || "").trim();

  if (uploadedPublicId) {
    const params = new URLSearchParams({
      publicId: uploadedPublicId,
    });

    if (download) {
      params.set("download", "1");
    }

    return `/api/course-material?${params.toString()}`;
  }

  return String(material?.resourceUrl || "").trim();
}

export function StudentCoursesWorkspace() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/student/courses", {
          credentials: "include",
          cache: "no-store",
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result.message || "Failed to load courses");
        setData(result);
      } catch (loadError) {
        setError(loadError.message || "Unable to load your course hub");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const catalog = data?.catalog || {};
  const student = data?.student || {};
  const stats = data?.stats || {};
  const teachingFaculty = Array.isArray(data?.teachingFaculty)
    ? data.teachingFaculty
    : [];
  const subjects = useMemo(
    () => (Array.isArray(catalog.subjects) ? catalog.subjects : []),
    [catalog.subjects],
  );
  const notices = Array.isArray(catalog.announcements) ? catalog.announcements : [];
  const highlights = Array.isArray(catalog.highlights) ? catalog.highlights : [];

  const materials = useMemo(
    () =>
      subjects.flatMap((subject) =>
        Array.isArray(subject.materials)
          ? subject.materials.map((material) => ({
              ...material,
              subjectName: subject.name || "Subject",
              subjectCode: subject.code || "",
              facultyName: subject.facultyName || "",
            }))
          : [],
      ),
    [subjects],
  );

  const filters = useMemo(() => {
    const types = Array.from(new Set(materials.map((item) => item.type).filter(Boolean)));
    return [
      { key: "all", label: "All" },
      { key: "important", label: "Important" },
      ...RESOURCE_TYPE_OPTIONS.filter((option) => types.includes(option.value)).map((option) => ({
        key: option.value,
        label: option.label,
      })),
    ];
  }, [materials]);

  const visibleMaterials = useMemo(() => {
    if (filter === "important") return materials.filter((item) => item.isImportant);
    if (filter !== "all") return materials.filter((item) => item.type === filter);
    return materials;
  }, [filter, materials]);

  const published = Boolean(catalog.isConfigured);
  const catalogHeading =
    catalog.title ||
    (student.course
      ? `${getCourseName(student.course)} Year ${student.year}`
      : "Course Hub");
  const hasCatalogContent =
    subjects.length > 0 ||
    notices.length > 0 ||
    materials.length > 0 ||
    Boolean(catalog.overview) ||
    Boolean(catalog.supportNote) ||
    Boolean(catalog.coordinatorName) ||
    Boolean(catalog.coordinatorEmail) ||
    Boolean(catalog.semesterLabel) ||
    (Array.isArray(highlights) && highlights.length > 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eff6ff_28%,#f8fafc_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[30px] border border-white/80 bg-white/92 p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.32)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
                  My Courses
                </span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {published ? "Published" : "Setup Pending"}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-950">
                {catalogHeading}
              </h1>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {student.course
                  ? `${getCourseName(student.course)} | Year ${student.year}`
                  : "Student course profile"}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {catalog.overview ||
                  (published
                    ? "This course catalog is now connected to your course and year. Subjects, resources, and academic notices will appear here as the admin fills in the details."
                    : "Your course subjects, resource links, and academic notices will appear here once the admin publishes this course catalog.")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {catalog.semesterLabel || "Academic track pending"}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  Updated {formatDateTime(catalog.updatedAt)}
                </span>
              </div>
              {highlights.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {highlights.map((item) => (
                    <span key={item} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[360px]">
              {[
                ["Subjects", stats.subjectCount || 0, "text-blue-700"],
                ["Resources", stats.materialCount || 0, "text-emerald-700"],
                ["Faculty", stats.facultyCount || 0, "text-indigo-700"],
                ["Important", stats.importantMaterialCount || 0, "text-amber-700"],
                ["Notices", stats.announcementCount || 0, "text-rose-700"],
                ["Your Cohort", stats.cohortSize || 0, "text-slate-900"],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                  <p className={`mt-2 text-2xl font-bold ${tone}`}>{loading ? "..." : value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading ? <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">Loading your course hub...</div> : null}
        {error ? <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-10 text-sm font-medium text-red-700">{error}</div> : null}

        {!loading && !error ? (
          <>
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Overview</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">Academic snapshot</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Program</p><p className="mt-2 text-sm font-semibold text-slate-950">{student.course ? getCourseName(student.course) : "-"}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Year</p><p className="mt-2 text-sm font-semibold text-slate-950">{student.year ? `Year ${student.year}` : "-"}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Coordinator</p><p className="mt-2 text-sm font-semibold text-slate-950">{catalog.coordinatorName || "Not published yet"}</p><p className="mt-1 text-xs text-slate-500">{catalog.coordinatorEmail || "Coordinator email pending"}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Support Note</p><p className="mt-2 text-sm font-semibold text-slate-950">{catalog.supportNote || "Course guidance note pending"}</p></div>
                </div>
                {!published ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    The admin has not published this catalog yet. Subjects and
                    materials will appear here automatically once it is ready.
                  </div>
                ) : !hasCatalogContent ? (
                  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    This catalog is now linked to your course and year. The
                    admin has created it, but subjects, materials, and notices
                    are still being filled in.
                  </div>
                ) : null}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Teaching Faculty</p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950">Course mentors</h2>
                  </div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><GraduationCap className="h-5 w-5" /></span>
                </div>
                <div className="mt-5 space-y-3">
                  {teachingFaculty.length > 0 ? teachingFaculty.map((faculty) => (
                    <div key={faculty._id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{faculty.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{faculty.email || "Email not available"}</p>
                    </div>
                  )) : <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Teaching faculty assignments for this course are still pending.</div>}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Notices</p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950">Latest updates</h2>
                  </div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700"><Megaphone className="h-5 w-5" /></span>
                </div>
                <div className="mt-5 space-y-3">
                  {notices.length > 0 ? notices.map((notice, index) => (
                    <div key={`${notice.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{notice.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{notice.summary || "Notice summary pending"}</p>
                        </div>
                        {notice.tag ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-700">{notice.tag}</span> : null}
                      </div>
                      {notice.link ? <a href={notice.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800">Open notice <ExternalLink className="h-3.5 w-3.5" /></a> : null}
                    </div>
                  )) : <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Important academic notices for your course will show here.</div>}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              {QUICK_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><item.icon className="h-5 w-5" /></span>
                  <p className="mt-4 text-lg font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-2 text-sm text-slate-600">Open the {item.label.toLowerCase()} workspace.</p>
                </Link>
              ))}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Subjects</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">Current study blocks</h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"><Users className="h-4 w-4" />{stats.subjectCount || 0} subjects</span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {subjects.length > 0 ? subjects.map((subject, index) => (
                  <div key={subject._id || `${subject.code}-${index}`} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{subject.code || "Subject"}</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-950">{subject.name || "Untitled subject"}</h3>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">{subject.credits ? `${subject.credits} Credits` : "Credits Pending"}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{subject.description || "Subject overview will appear here once it is published."}</p>
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Faculty In Charge</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{subject.facultyName || "Faculty assignment pending"}</p>
                      <p className="mt-1 text-xs text-slate-500">{Array.isArray(subject.materials) ? `${subject.materials.length} materials linked` : "No materials linked yet"}</p>
                    </div>
                  </div>
                )) : <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500 md:col-span-2 xl:col-span-3">No subjects are published for your course year yet.</div>}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Resource Hub</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">Course materials and links</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <button key={item.key} type="button" onClick={() => setFilter(item.key)} className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${filter === item.key ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {visibleMaterials.length > 0 ? visibleMaterials.map((item, index) => {
                  const Icon = getTypeIcon(item.type);
                  const openHref = buildMaterialActionHref(item);
                  const downloadHref = buildMaterialActionHref(item, {
                    download: true,
                  });
                  return (
                    <div key={`${item.subjectCode}-${item.title}-${index}`} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Icon className="h-5 w-5" /></span>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${item.isImportant ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                          {item.isImportant ? "Important" : getTypeLabel(item.type)}
                        </span>
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-950">{item.title || "Untitled resource"}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.subjectName}{item.facultyName ? ` | ${item.facultyName}` : ""}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.description || "Resource description will appear here once it is added."}</p>
                      {item.uploadedFileName ? <p className="mt-3 text-xs font-medium text-blue-700">{item.uploadedFileName}</p> : null}
                      {openHref ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <a href={openHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-slate-800">
                            Open Resource <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <a href={downloadHref} rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 hover:bg-slate-100">
                            Download <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="mt-4 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Link not added yet</span>
                      )}
                    </div>
                  );
                }) : <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500 lg:col-span-2 xl:col-span-3">No course materials match this filter yet.</div>}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function StudentCoursesPage() {
  return (
    <StudentComingSoonPage
      title="My Courses"
      description="The full course workspace is being polished right now. Your existing course content is kept safely in place and we will continue building this page next."
      accent="emerald"
    />
  );
}
