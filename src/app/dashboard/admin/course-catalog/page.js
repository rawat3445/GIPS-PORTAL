"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Save, Trash2, Users } from "lucide-react";
import {
  COURSE_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
  YEAR_OPTIONS,
  createEmptyAnnouncement,
  createEmptyCourseCatalog,
  createEmptyMaterial,
  createEmptySubject,
} from "../../../lib/courseCatalog";

function createEditorState(catalog) {
  const base = createEmptyCourseCatalog({
    course: catalog?.course,
    year: catalog?.year,
  });

  return {
    ...base,
    ...catalog,
    year: catalog?.year ? String(catalog.year) : String(base.year || ""),
    highlights: Array.isArray(catalog?.highlights)
      ? catalog.highlights.join("\n")
      : "",
    subjects: Array.isArray(catalog?.subjects) ? catalog.subjects : [],
    announcements: Array.isArray(catalog?.announcements)
      ? catalog.announcements
      : [],
  };
}

function formatDateTime(value) {
  if (!value) return "Not saved yet";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminCourseCatalogPage() {
  const [selectedCourse, setSelectedCourse] = useState("BPT");
  const [selectedYear, setSelectedYear] = useState("1");
  const [form, setForm] = useState(() =>
    createEditorState(createEmptyCourseCatalog({ course: "BPT", year: 1 })),
  );
  const [teachingFaculty, setTeachingFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        setError("");
        setNotice("");
        const params = new URLSearchParams({
          course: selectedCourse,
          year: selectedYear,
        });
        const res = await fetch(`/api/admin/course-catalog?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Failed to load course catalog");
        }
        setForm(createEditorState(data.catalog));
        setTeachingFaculty(Array.isArray(data.teachingFaculty) ? data.teachingFaculty : []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load course catalog");
        setForm(
          createEditorState(
            createEmptyCourseCatalog({
              course: selectedCourse,
              year: Number(selectedYear),
            }),
          ),
        );
        setTeachingFaculty([]);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [selectedCourse, selectedYear]);

  const summary = useMemo(() => {
    const subjectCount = Array.isArray(form.subjects) ? form.subjects.length : 0;
    const materialCount = Array.isArray(form.subjects)
      ? form.subjects.reduce(
          (total, subject) =>
            total + (Array.isArray(subject.materials) ? subject.materials.length : 0),
          0,
        )
      : 0;
    const announcementCount = Array.isArray(form.announcements)
      ? form.announcements.length
      : 0;

    return { subjectCount, materialCount, announcementCount };
  }, [form.announcements, form.subjects]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateSubject(index, field, value) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subject, itemIndex) =>
        itemIndex === index ? { ...subject, [field]: value } : subject,
      ),
    }));
  }

  function updateMaterial(subjectIndex, materialIndex, field, value) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subject, itemIndex) =>
        itemIndex === subjectIndex
          ? {
              ...subject,
              materials: subject.materials.map((material, subIndex) =>
                subIndex === materialIndex
                  ? { ...material, [field]: value }
                  : material,
              ),
            }
          : subject,
      ),
    }));
  }

  function updateAnnouncement(index, field, value) {
    setForm((prev) => ({
      ...prev,
      announcements: prev.announcements.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setNotice("");
      const res = await fetch("/api/admin/course-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          course: selectedCourse,
          year: Number(selectedYear),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to save course catalog");
      }
      setForm(createEditorState(data.catalog));
      setNotice(data.message || "Course catalog saved");
    } catch (saveError) {
      setError(saveError.message || "Unable to save course catalog");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-700">
                <BookOpen className="h-3.5 w-3.5" />
                Course Catalog
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-950">
                Student My Courses Publisher
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Publish the course overview, subjects, study links, and notices that students should see in My Courses.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  Updated {formatDateTime(form.updatedAt)}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  {form.updatedByName
                    ? `Last saved by ${form.updatedByName}`
                    : "No published version yet"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[170px_170px_auto]">
              <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100">
                {COURSE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.value}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100">
                {YEAR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <button type="button" onClick={handleSave} disabled={saving || loading} className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Catalog"}
              </button>
            </div>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div> : null}
        {notice ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">{notice}</div> : null}

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Subjects", summary.subjectCount, "text-indigo-700"],
            ["Materials", summary.materialCount, "text-emerald-700"],
            ["Notices", summary.announcementCount, "text-rose-700"],
            ["Teaching Faculty", teachingFaculty.length, "text-slate-900"],
          ].map(([label, value, tone]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className={`mt-2 text-2xl font-bold ${tone}`}>{loading ? "..." : value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">Overview Block</p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">Student-facing summary</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input value={form.title || ""} onChange={(e) => updateField("title", e.target.value)} placeholder="Page title" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              <input value={form.semesterLabel || ""} onChange={(e) => updateField("semesterLabel", e.target.value)} placeholder="Semester label" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              <input value={form.coordinatorName || ""} onChange={(e) => updateField("coordinatorName", e.target.value)} placeholder="Coordinator name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              <input value={form.coordinatorEmail || ""} onChange={(e) => updateField("coordinatorEmail", e.target.value)} placeholder="Coordinator email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              <textarea rows={4} value={form.overview || ""} onChange={(e) => updateField("overview", e.target.value)} placeholder="Overview for students" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 md:col-span-2" />
              <textarea rows={3} value={form.supportNote || ""} onChange={(e) => updateField("supportNote", e.target.value)} placeholder="Support note" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 md:col-span-2" />
              <textarea rows={4} value={form.highlights || ""} onChange={(e) => updateField("highlights", e.target.value)} placeholder="One highlight per line" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 md:col-span-2" />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Faculty Signals</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">Available faculty</h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Users className="h-5 w-5" /></span>
            </div>
            <div className="mt-5 space-y-3">
              {loading ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading teaching faculty...</div> : null}
              {!loading && teachingFaculty.length > 0 ? teachingFaculty.map((faculty) => (
                <div key={faculty._id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">{faculty.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{faculty.email || "Email not available"}</p>
                </div>
              )) : null}
              {!loading && teachingFaculty.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">No teaching faculty are assigned to this course yet.</div> : null}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Subjects</p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">Publish subjects and study links</h2>
            </div>
            <button type="button" onClick={() => setForm((prev) => ({ ...prev, subjects: [...prev.subjects, createEmptySubject()] }))} className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {form.subjects.length > 0 ? form.subjects.map((subject, subjectIndex) => (
              <div key={`subject-${subjectIndex}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <input value={subject.code || ""} onChange={(e) => updateSubject(subjectIndex, "code", e.target.value)} placeholder="Subject code" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    <input value={subject.name || ""} onChange={(e) => updateSubject(subjectIndex, "name", e.target.value)} placeholder="Subject name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    <input type="number" min="0" value={subject.credits || ""} onChange={(e) => updateSubject(subjectIndex, "credits", e.target.value)} placeholder="Credits" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    <input value={subject.facultyName || ""} onChange={(e) => updateSubject(subjectIndex, "facultyName", e.target.value)} placeholder="Faculty name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    <textarea rows={3} value={subject.description || ""} onChange={(e) => updateSubject(subjectIndex, "description", e.target.value)} placeholder="Subject description" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 md:col-span-2 xl:col-span-4" />
                  </div>
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, subjects: prev.subjects.filter((_, index) => index !== subjectIndex) }))} className="inline-flex items-center justify-center rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-200">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </button>
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Materials</p>
                      <p className="mt-1 text-sm text-slate-500">Attach links, PDFs, videos, and notes for this subject.</p>
                    </div>
                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, subjects: prev.subjects.map((item, index) => index === subjectIndex ? { ...item, materials: [...(item.materials || []), createEmptyMaterial()] } : item) }))} className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Material
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {Array.isArray(subject.materials) && subject.materials.length > 0 ? subject.materials.map((material, materialIndex) => (
                      <div key={`material-${materialIndex}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <div className="grid gap-4 xl:grid-cols-[1fr_180px_1.2fr_auto]">
                          <input value={material.title || ""} onChange={(e) => updateMaterial(subjectIndex, materialIndex, "title", e.target.value)} placeholder="Material title" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                          <select value={material.type || "note"} onChange={(e) => updateMaterial(subjectIndex, materialIndex, "type", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                            {RESOURCE_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                          <input value={material.resourceUrl || ""} onChange={(e) => updateMaterial(subjectIndex, materialIndex, "resourceUrl", e.target.value)} placeholder="Resource URL" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                          <button type="button" onClick={() => setForm((prev) => ({ ...prev, subjects: prev.subjects.map((item, index) => index === subjectIndex ? { ...item, materials: item.materials.filter((_, subIndex) => subIndex !== materialIndex) } : item) }))} className="inline-flex items-center justify-center rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-200">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </button>
                        </div>
                        <textarea rows={2} value={material.description || ""} onChange={(e) => updateMaterial(subjectIndex, materialIndex, "description", e.target.value)} placeholder="Short material description" className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                        <label className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                          <input type="checkbox" checked={Boolean(material.isImportant)} onChange={(e) => updateMaterial(subjectIndex, materialIndex, "isImportant", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
                          Mark as important
                        </label>
                      </div>
                    )) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">No materials added yet.</div>}
                  </div>
                </div>
              </div>
            )) : <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">No subjects added yet.</div>}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Notices</p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">Publish academic announcements</h2>
            </div>
            <button type="button" onClick={() => setForm((prev) => ({ ...prev, announcements: [...prev.announcements, createEmptyAnnouncement()] }))} className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Notice
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {form.announcements.length > 0 ? form.announcements.map((item, index) => (
              <div key={`notice-${index}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-4 xl:grid-cols-[1fr_220px_1.1fr_auto]">
                  <input value={item.title || ""} onChange={(e) => updateAnnouncement(index, "title", e.target.value)} placeholder="Notice title" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                  <input value={item.tag || ""} onChange={(e) => updateAnnouncement(index, "tag", e.target.value)} placeholder="Tag" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                  <input value={item.link || ""} onChange={(e) => updateAnnouncement(index, "link", e.target.value)} placeholder="Notice link" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, announcements: prev.announcements.filter((_, itemIndex) => itemIndex !== index) }))} className="inline-flex items-center justify-center rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-200">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </button>
                </div>
                <textarea rows={3} value={item.summary || ""} onChange={(e) => updateAnnouncement(index, "summary", e.target.value)} placeholder="Announcement summary" className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
              </div>
            )) : <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">No notices added yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
