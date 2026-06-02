"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Clock3,
  Download,
  ExternalLink,
  FileUp,
  GraduationCap,
  Lock,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import {
  RESOURCE_TYPE_OPTIONS,
  YEAR_OPTIONS,
  createEmptyAnnouncement,
  createEmptyCourseCatalog,
  createEmptyMaterial,
  createEmptySubject,
  getCourseName,
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

function getBaseTitleFromFileName(fileName) {
  const normalized = String(fileName || "").trim();
  if (!normalized) return "";
  return normalized.replace(/\.[^.]+$/, "");
}

function buildUploadKey(subjectIndex, materialIndex) {
  return `${subjectIndex}-${materialIndex}`;
}

function buildMaterialActionHref(material, year, { download = false } = {}) {
  const uploadedPublicId = String(material?.resourcePublicId || "").trim();

  if (uploadedPublicId) {
    const params = new URLSearchParams({
      publicId: uploadedPublicId,
      year: String(year || ""),
    });

    if (download) {
      params.set("download", "1");
    }

    return `/api/course-material?${params.toString()}`;
  }

  return String(material?.resourceUrl || "").trim();
}

export default function FacultyUploadMaterialsPage() {
  const [selectedYear, setSelectedYear] = useState("1");
  const [faculty, setFaculty] = useState(null);
  const [form, setForm] = useState(() =>
    createEditorState(createEmptyCourseCatalog({ year: 1 })),
  );
  const [teachingFaculty, setTeachingFaculty] = useState([]);
  const [history, setHistory] = useState([]);
  const [yearSummaries, setYearSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const didAutoSelectYearRef = useRef(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        setError("");
        setNotice("");

        const params = new URLSearchParams({ year: selectedYear });
        const res = await fetch(`/api/faculty/course-catalog?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load course content");
        }

        const summaries = Array.isArray(data.yearSummaries) ? data.yearSummaries : [];
        setYearSummaries(summaries);

        const preferredYear = String(data.preferredYear || "");
        const hasCurrentYearContent = summaries.some(
          (item) =>
            String(item?.year || "") === String(selectedYear) &&
            (Number(item?.materialCount || 0) > 0 ||
              Number(item?.subjectCount || 0) > 0),
        );
        const currentYearIsDefault = String(selectedYear) === "1";
        if (
          !didAutoSelectYearRef.current &&
          preferredYear &&
          preferredYear !== String(selectedYear) &&
          currentYearIsDefault &&
          !hasCurrentYearContent
        ) {
          didAutoSelectYearRef.current = true;
          setSelectedYear(preferredYear);
          return;
        }

        setFaculty(data.faculty || null);
        setForm(createEditorState(data.catalog));
        setTeachingFaculty(Array.isArray(data.teachingFaculty) ? data.teachingFaculty : []);
        setHistory(Array.isArray(data.history) ? data.history : []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load course content");
        setForm((prev) =>
          createEditorState(
            createEmptyCourseCatalog({
              course: prev.course,
              year: Number(selectedYear),
            }),
          ),
        );
        setTeachingFaculty([]);
        setHistory([]);
        setYearSummaries([]);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [selectedYear]);

  const summary = useMemo(() => {
    const subjectCount = Array.isArray(form.subjects) ? form.subjects.length : 0;
    const materialCount = Array.isArray(form.subjects)
      ? form.subjects.reduce(
          (total, subject) =>
            total + (Array.isArray(subject.materials) ? subject.materials.length : 0),
          0,
        )
      : 0;
    const uploadedCount = Array.isArray(form.subjects)
      ? form.subjects.reduce(
          (total, subject) =>
            total +
            (Array.isArray(subject.materials)
              ? subject.materials.filter((material) => material.uploadedFileName).length
              : 0),
          0,
        )
      : 0;
    const announcementCount = Array.isArray(form.announcements)
      ? form.announcements.length
      : 0;

    return {
      subjectCount,
      materialCount,
      uploadedCount,
      announcementCount,
    };
  }, [form.announcements, form.subjects]);

  const isPublished = form.publishStatus === "published";

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

  function updateMaterialFields(subjectIndex, materialIndex, updates) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subject, itemIndex) =>
        itemIndex === subjectIndex
          ? {
              ...subject,
              materials: subject.materials.map((material, subIndex) =>
                subIndex === materialIndex
                  ? { ...material, ...updates }
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

  function removeMaterial(subjectIndex, materialIndex) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((item, index) =>
        index === subjectIndex
          ? {
              ...item,
              materials: item.materials.filter(
                (_, subIndex) => subIndex !== materialIndex,
              ),
            }
          : item,
      ),
    }));
    setNotice(
      "Material removed from the draft. Click Save Draft or Publish to apply the deletion.",
    );
  }

  function removeUploadedFile(subjectIndex, materialIndex) {
    updateMaterialFields(subjectIndex, materialIndex, {
      storageProvider: "",
      resourceUrl: "",
      resourcePublicId: "",
      uploadedFileName: "",
      uploadedMimeType: "",
    });
    setNotice(
      "Uploaded file removed from the draft. Click Save Draft or Publish to delete the old file from the course content.",
    );
  }

  async function handleFileUpload(subjectIndex, materialIndex, file) {
    if (!file) return;

    const key = buildUploadKey(subjectIndex, materialIndex);

    try {
      setUploadingKey(key);
      setError("");
      setNotice("");

      const body = new FormData();
      body.append("file", file);
      body.append("year", selectedYear);

      const res = await fetch("/api/faculty/course-material-upload", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to upload file");
      }

      const uploadedFile = data.file || {};
      updateMaterialFields(subjectIndex, materialIndex, {
        title:
          form.subjects?.[subjectIndex]?.materials?.[materialIndex]?.title ||
          getBaseTitleFromFileName(uploadedFile.uploadedFileName),
        type: uploadedFile.type || "pdf",
        storageProvider: uploadedFile.storageProvider || "gcs",
        resourceUrl: uploadedFile.resourceUrl || "",
        resourcePublicId: uploadedFile.resourcePublicId || "",
        uploadedFileName: uploadedFile.uploadedFileName || file.name || "",
        uploadedMimeType: uploadedFile.uploadedMimeType || file.type || "",
      });
      setNotice(
        "File uploaded to the draft. Save or publish this course content to keep the material visible in the catalog.",
      );
    } catch (uploadError) {
      setError(uploadError.message || "Unable to upload file");
    } finally {
      setUploadingKey("");
    }
  }

  async function handleSave(action = "save") {
    try {
      setSaving(true);
      setError("");
      setNotice("");

      const res = await fetch("/api/faculty/course-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          year: Number(selectedYear),
          action,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to save course content");
      }

      setForm(createEditorState(data.catalog));
      setHistory(Array.isArray(data.history) ? data.history : []);
      setNotice(data.message || "Course content saved");
    } catch (saveError) {
      setError(saveError.message || "Unable to save course content");
    } finally {
      setSaving(false);
    }
  }

  function renderMaterialsSection() {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              Subjects
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Publish subjects, links, PDFs, and docs
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                subjects: [...prev.subjects, createEmptySubject()],
              }))
            }
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {form.subjects.length > 0 ? (
            form.subjects.map((subject, subjectIndex) => (
              <div key={`subject-${subjectIndex}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <input value={subject.code || ""} onChange={(e) => updateSubject(subjectIndex, "code", e.target.value)} placeholder="Subject code" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    <input value={subject.name || ""} onChange={(e) => updateSubject(subjectIndex, "name", e.target.value)} placeholder="Subject name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    <input type="number" min="0" value={subject.credits || ""} onChange={(e) => updateSubject(subjectIndex, "credits", e.target.value)} placeholder="Credits" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    <input value={subject.facultyName || ""} onChange={(e) => updateSubject(subjectIndex, "facultyName", e.target.value)} placeholder="Faculty name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    <textarea rows={3} value={subject.description || ""} onChange={(e) => updateSubject(subjectIndex, "description", e.target.value)} placeholder="Subject description" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 md:col-span-2 xl:col-span-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        subjects: prev.subjects.filter((_, index) => index !== subjectIndex),
                      }))
                    }
                    className="inline-flex items-center justify-center rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </button>
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                        Materials
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Add links or upload PDF, DOC, and DOCX files directly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          subjects: prev.subjects.map((item, index) =>
                            index === subjectIndex
                              ? {
                                  ...item,
                                  materials: [...(item.materials || []), createEmptyMaterial()],
                                }
                              : item,
                          ),
                        }))
                      }
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Material
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {Array.isArray(subject.materials) && subject.materials.length > 0 ? (
                      subject.materials.map((material, materialIndex) => {
                        const key = buildUploadKey(subjectIndex, materialIndex);
                        const isUploading = uploadingKey === key;
                        const openHref = buildMaterialActionHref(
                          material,
                          selectedYear,
                        );
                        const downloadHref = buildMaterialActionHref(
                          material,
                          selectedYear,
                          { download: true },
                        );
                        return (
                          <div key={`material-${materialIndex}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <div className="grid gap-4 xl:grid-cols-[1fr_180px_1.2fr_auto]">
                              <input value={material.title || ""} onChange={(e) => updateMaterial(subjectIndex, materialIndex, "title", e.target.value)} placeholder="Material title" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                              <select value={material.type || "note"} onChange={(e) => updateMaterial(subjectIndex, materialIndex, "type", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                                {RESOURCE_TYPE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <input value={material.resourceUrl || ""} onChange={(e) => updateMaterial(subjectIndex, materialIndex, "resourceUrl", e.target.value)} placeholder="Resource URL or uploaded file link" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                              <button
                                type="button"
                                onClick={() => removeMaterial(subjectIndex, materialIndex)}
                                className="inline-flex items-center justify-center rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </button>
                            </div>

                            <textarea rows={2} value={material.description || ""} onChange={(e) => updateMaterial(subjectIndex, materialIndex, "description", e.target.value)} placeholder="Short material description" className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />

                            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_auto_auto]">
                              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100">
                                <UploadCloud className="h-4 w-4" />
                                {isUploading ? "Uploading..." : "Upload PDF / DOC"}
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    handleFileUpload(subjectIndex, materialIndex, file);
                                    e.target.value = "";
                                  }}
                                  className="hidden"
                                />
                              </label>

                              {openHref ? (
                                <a href={openHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                                  <ExternalLink className="h-4 w-4" />
                                  Open
                                </a>
                              ) : (
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                                  No file or link yet
                                </div>
                              )}

                              {downloadHref ? (
                                <a href={downloadHref} rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                                  <Download className="h-4 w-4" />
                                  Download
                                </a>
                              ) : (
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
                                  Download ready after upload
                                </div>
                              )}
                            </div>

                            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div className="text-sm text-slate-500">
                                {material.uploadedFileName ? (
                                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
                                    <FileUp className="h-4 w-4" />
                                    {material.uploadedFileName}
                                  </span>
                                ) : (
                                  "Upload a file to auto-fill the material link, or paste any resource URL manually."
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                {material.resourcePublicId || material.resourceUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => removeUploadedFile(subjectIndex, materialIndex)}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Remove File
                                  </button>
                                ) : null}
                                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                                  <input type="checkbox" checked={Boolean(material.isImportant)} onChange={(e) => updateMaterial(subjectIndex, materialIndex, "isImportant", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
                                  Mark as important
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        No materials added yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
              No subjects added yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderAnnouncementsSection() {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">
              Notices
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">Publish academic announcements</h2>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                announcements: [...prev.announcements, createEmptyAnnouncement()],
              }))
            }
            className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Notice
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {form.announcements.length > 0 ? (
            form.announcements.map((item, index) => (
              <div key={`notice-${index}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-4 xl:grid-cols-[1fr_220px_1.1fr_auto]">
                  <input value={item.title || ""} onChange={(e) => updateAnnouncement(index, "title", e.target.value)} placeholder="Notice title" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                  <input value={item.tag || ""} onChange={(e) => updateAnnouncement(index, "tag", e.target.value)} placeholder="Tag" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                  <input value={item.link || ""} onChange={(e) => updateAnnouncement(index, "link", e.target.value)} placeholder="Notice link" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        announcements: prev.announcements.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                    className="inline-flex items-center justify-center rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </button>
                </div>
                <textarea rows={3} value={item.summary || ""} onChange={(e) => updateAnnouncement(index, "summary", e.target.value)} placeholder="Announcement summary" className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
              No notices added yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  const assignedCourse = String(
    faculty?.assignedCourse || form.course || "",
  ).toUpperCase();
  const courseLabel = assignedCourse ? getCourseName(assignedCourse) : "Assigned course";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dcfce7_0%,#ecfdf5_25%,#f8fafc_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[30px] border border-white/80 bg-white/92 p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.32)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  <BookOpen className="h-3.5 w-3.5" />
                  Faculty Course Content
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">
                  <Lock className="h-3.5 w-3.5" />
                  Course Locked
                </span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                    isPublished
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isPublished ? "Published" : "Draft"}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-950">Publish My Courses Content</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                This is the faculty-side version of the course catalog editor. Your assigned
                course stays locked, you choose the year, and you can upload PDF or DOC files
                directly into student materials. Uploaded files stay in draft until you save
                and publish this course content.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  {assignedCourse ? `${courseLabel} (${assignedCourse})` : "Assigned course pending"}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  Updated {formatDateTime(form.updatedAt)}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  {form.updatedByName ? `Last saved by ${form.updatedByName}` : "No published version yet"}
                </span>
                {form.publishedAt ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    Published {formatDateTime(form.publishedAt)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[170px_190px_auto_auto_auto]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Assigned Course</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{assignedCourse || "Not assigned"}</p>
              </div>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-100">
                {YEAR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {(() => {
                      const summary = yearSummaries.find(
                        (item) => String(item?.year || "") === String(option.value),
                      );
                      if (!summary) return option.label;

                      const materialCount = Number(summary.materialCount || 0);
                      const subjectCount = Number(summary.subjectCount || 0);
                      if (materialCount > 0) {
                        return `${option.label} (${materialCount} materials)`;
                      }
                      if (subjectCount > 0) {
                        return `${option.label} (${subjectCount} subjects)`;
                      }
                      return option.label;
                    })()}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => handleSave("save")} disabled={saving || loading || !assignedCourse} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button type="button" onClick={() => handleSave("publish")} disabled={saving || loading || !assignedCourse} className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Publish"}
              </button>
              <button type="button" onClick={() => handleSave("unpublish")} disabled={saving || loading || !assignedCourse || !isPublished} className="inline-flex items-center justify-center rounded-2xl bg-amber-100 px-5 py-3 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-200 disabled:opacity-60">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Move To Draft"}
              </button>
            </div>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div> : null}
        {notice ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">{notice}</div> : null}
        {!error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
            Uploaded files are added to the faculty draft first. Students can open them only
            after you click <span className="font-semibold">Publish</span>.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-5">
          {[
            ["Subjects", summary.subjectCount, "text-emerald-700"],
            ["Materials", summary.materialCount, "text-blue-700"],
            ["Uploaded Files", summary.uploadedCount, "text-violet-700"],
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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Overview Block</p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Faculty Signals</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">Teaching faculty</h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Users className="h-5 w-5" /></span>
            </div>
            <div className="mt-5 space-y-3">
              {faculty ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">You are editing as</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{faculty.name || "Faculty"}</p>
                  <p className="mt-1 text-xs text-slate-500">{faculty.email || "Email not available"}</p>
                </div>
              ) : null}
              {loading ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading teaching faculty...</div> : null}
              {!loading && teachingFaculty.length > 0 ? teachingFaculty.map((member) => (
                <div key={member._id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{member.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{member.email || "Email not available"}</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700"><GraduationCap className="h-4 w-4" /></span>
                  </div>
                </div>
              )) : null}
              {!loading && teachingFaculty.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">No teaching faculty are assigned to this course yet.</div> : null}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
                Content History
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">
                Faculty draft and publish history
              </h2>
            </div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Clock3 className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {history.length > 0 ? (
              history.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.actionLabel}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.details || "Course content updated"}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No faculty course-content history yet for this course and year.
              </div>
            )}
          </div>
        </div>

        {renderMaterialsSection()}
        {renderAnnouncementsSection()}
      </div>
    </div>
  );
}
