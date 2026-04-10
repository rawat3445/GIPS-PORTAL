"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import StudentResumePreview from "../_components/StudentResumePreview";
import {
  createResumeDraft,
  createResumePreviewDraft,
  RESUME_BUILDER_UNLOCK_POINTS,
  RESUME_BUILDER_UPDATE_POINTS,
  RESUME_POINTS_RULES,
  RESUME_POINTS_UNLOCK_NOTE,
  RESUME_ACCENT_OPTIONS,
  RESUME_TEMPLATE_OPTIONS,
  TOTAL_STUDENT_POINTS,
} from "../../../../lib/studentResume";

function toCsv(values) {
  return Array.isArray(values) ? values.filter(Boolean).join(", ") : "";
}

function fromCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toLines(values) {
  return Array.isArray(values) ? values.filter(Boolean).join("\n") : "";
}

function fromLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createEntry(type) {
  const id = `${type}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

  if (type === "education") {
    return {
      id,
      institution: "",
      course: "",
      location: "",
      startYear: "",
      endYear: "",
      score: "",
      description: "",
    };
  }

  if (type === "project") {
    return {
      id,
      title: "",
      role: "",
      techStack: [],
      startDate: "",
      endDate: "",
      description: "",
      bullets: [],
      link: "",
    };
  }

  if (type === "internship") {
    return {
      id,
      organization: "",
      role: "",
      duration: "",
      startDate: "",
      endDate: "",
      description: "",
      bullets: [],
    };
  }

  if (type === "certification") {
    return {
      id,
      title: "",
      issuer: "",
      issuedOn: "",
      link: "",
      description: "",
    };
  }

  if (type === "achievement") {
    return {
      id,
      title: "",
      description: "",
      source: "",
      sourceKey: "",
      isImportedFromPoints: false,
    };
  }

  return {
    id,
    title: "",
    description: "",
  };
}

function formatSavedAt(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function FormCard({ title, description, children, action }) {
  return (
    <section className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_22px_52px_-38px_rgba(15,23,42,0.38)] md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white ${props.className || ""}`}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white ${props.className || ""}`}
    />
  );
}

function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 ${className}`}
    >
      {children}
    </button>
  );
}

const PREVIEW_SECTION_CONTENTS = [
  {
    title: "Header and contact block",
    detail:
      "Name, headline, course, year, contact details, and profile image placement.",
  },
  {
    title: "Professional summary",
    detail:
      "A short introduction explaining the student's strengths, goals, and profile.",
  },
  {
    title: "Education",
    detail:
      "Institution, course, location, study years, score, and academic note.",
  },
  {
    title: "Skills",
    detail:
      "Technical skills, tools, soft skills, and language groups in a clean layout.",
  },
  {
    title: "Projects and internships",
    detail:
      "Hands-on work with roles, dates, tools, descriptions, and bullet highlights.",
  },
  {
    title: "Certifications",
    detail:
      "External courses, certificates, workshops, and supporting credentials.",
  },
  {
    title: "Achievements",
    detail:
      "Student-point imports plus manual academic or extracurricular achievements.",
  },
  {
    title: "Activities",
    detail:
      "Clubs, volunteering, seminars, workshops, and participation details.",
  },
];

const BUILDER_UNLOCK_FEATURES = [
  "Edit every resume section with your own real data.",
  "Save the draft to your student account.",
  "Import eligible achievements from the student points system.",
  "Download the final resume layout as PDF.",
];

function createDefaultAccess() {
  return {
    status: "preview-only",
    title: "Preview Only",
    description: `Reach ${RESUME_BUILDER_UNLOCK_POINTS}/${TOTAL_STUDENT_POINTS} total student points to unlock full resume editing.`,
    canPreview: true,
    canEdit: false,
    hasUnlockedBefore: false,
    currentPoints: 0,
    firstUnlockPoints: RESUME_BUILDER_UNLOCK_POINTS,
    updatePoints: RESUME_BUILDER_UPDATE_POINTS,
    qualifiesForFirstUnlock: false,
    qualifiesForUpdates: false,
    pointsNeededForFirstUnlock: RESUME_BUILDER_UNLOCK_POINTS,
    pointsNeededForUpdate: RESUME_BUILDER_UPDATE_POINTS,
    summaryVerified: false,
    usingDemoPreview: true,
  };
}

export default function StudentResumeBuilderPage() {
  const [resume, setResume] = useState(null);
  const [access, setAccess] = useState(createDefaultAccess());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const accessInfo = access || createDefaultAccess();
  const canEdit = Boolean(accessInfo.canEdit);
  const currentPoints = Number(accessInfo.currentPoints || 0);
  const pointsRemaining = Math.max(
    0,
    Number(accessInfo.pointsNeededForFirstUnlock || 0),
  );
  const previewProgress = Math.max(
    0,
    Math.min(100, (currentPoints / TOTAL_STUDENT_POINTS) * 100),
  );
  const resumePointsGuideRows = [
    {
      ...RESUME_POINTS_RULES.previewAccess,
      currentStatus: "Available now to every student",
    },
    {
      ...RESUME_POINTS_RULES.builderUnlock,
      currentStatus: canEdit
        ? `Unlocked now • ${currentPoints}/${TOTAL_STUDENT_POINTS} points`
        : `Locked • ${pointsRemaining} more point${
            pointsRemaining === 1 ? "" : "s"
          } needed`,
    },
    {
      ...RESUME_POINTS_RULES.builderUpdates,
      currentStatus: accessInfo.hasUnlockedBefore
        ? canEdit
          ? "Available now"
          : `Locked • ${Math.max(
              0,
              Number(accessInfo.pointsNeededForUpdate || 0),
            )} more point${
              Math.max(0, Number(accessInfo.pointsNeededForUpdate || 0)) === 1
                ? ""
                : "s"
            } needed`
        : "Available after first full unlock",
    },
    {
      ...RESUME_POINTS_RULES.coverageAchievement,
      currentStatus: canEdit
        ? "Unlocked builder • import when this rule is met"
        : "Preview only until 100 points",
    },
    {
      ...RESUME_POINTS_RULES.streakAchievement,
      currentStatus: canEdit
        ? "Unlocked builder • import when this rule is met"
        : "Preview only until 100 points",
    },
    {
      ...RESUME_POINTS_RULES.monthlyConsistencyAchievement,
      currentStatus: canEdit
        ? "Unlocked builder • import when this rule is met"
        : "Preview only until 100 points",
    },
    {
      ...RESUME_POINTS_RULES.strongProfileAchievement,
      currentStatus: canEdit
        ? "Unlocked builder • import when this rule is met"
        : "Preview only until 100 points",
    },
  ];

  useEffect(() => {
    async function loadResume() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/student/resume", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load resume builder");
        }

        setResume(
          data.resume ||
            (data.access?.canEdit
              ? createResumeDraft({})
              : createResumePreviewDraft({})),
        );
        setAccess(data.access || createDefaultAccess());
        setLastSavedAt(data.resume?.updatedAt || "");
      } catch (loadError) {
        setResume(createResumePreviewDraft({}));
        setAccess(createDefaultAccess());
        setError(loadError.message || "Unable to load resume builder");
      } finally {
        setLoading(false);
      }
    }

    loadResume();
  }, []);

  function setPersonalField(field, value) {
    setResume((current) => ({
      ...current,
      personal: {
        ...(current?.personal || {}),
        [field]: value,
      },
    }));
  }

  function setPreferencesField(field, value) {
    setResume((current) => ({
      ...current,
      preferences: {
        ...(current?.preferences || {}),
        [field]: value,
      },
    }));
  }

  function updateListItem(section, index, field, value) {
    setResume((current) => {
      const items = Array.isArray(current?.[section]) ? [...current[section]] : [];
      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...current,
        [section]: items,
      };
    });
  }

  function addListItem(section, type) {
    setResume((current) => ({
      ...current,
      [section]: [...(Array.isArray(current?.[section]) ? current[section] : []), createEntry(type)],
    }));
  }

  function removeListItem(section, index) {
    setResume((current) => ({
      ...current,
      [section]: (Array.isArray(current?.[section]) ? current[section] : []).filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  }

  async function handleSave() {
    if (!resume) return;
    if (!canEdit) {
      setSaveState("error");
      setSaveMessage(accessInfo.description);
      return;
    }

    try {
      setSaveState("saving");
      setSaveMessage("");

      const res = await fetch("/api/student/resume", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ resume }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to save resume draft");
      }

      setResume(data.resume || resume);
      setAccess(data.access || accessInfo);
      setLastSavedAt(data.resume?.updatedAt || new Date().toISOString());
      setSaveState("saved");
      setSaveMessage(data?.message || "Resume draft saved");
    } catch (saveError) {
      setSaveState("error");
      setSaveMessage(saveError.message || "Unable to save resume draft");
    }
  }

  async function handleImportFromPoints() {
    if (!canEdit) {
      setSaveState("error");
      setSaveMessage(accessInfo.description);
      return;
    }

    try {
      setSaveState("saving");
      setSaveMessage("");

      const res = await fetch("/api/student/resume/import-points", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to import achievements");
      }

      setResume(data.resume || resume);
      setAccess(data.access || accessInfo);
      setLastSavedAt(data.resume?.updatedAt || new Date().toISOString());
      setSaveState("saved");
      setSaveMessage(
        data?.importedCount
          ? `${data.importedCount} achievement${
              data.importedCount === 1 ? "" : "s"
            } imported from points`
          : data?.message || "No new points achievements were available",
      );
    } catch (importError) {
      setSaveState("error");
      setSaveMessage(importError.message || "Unable to import achievements");
    }
  }

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#eff6ff_24%,#f8fafc_58%,#f8fafc_100%)] px-4 py-6 md:px-6">
        <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 text-sm text-slate-500 shadow-sm">
          Loading resume builder...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#eff6ff_24%,#f8fafc_58%,#f8fafc_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="resume-builder-shell rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(255,251,235,0.94),rgba(239,246,255,0.94))] p-5 shadow-[0_30px_70px_-48px_rgba(15,23,42,0.35)] md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <Link
                href="/dashboard/student/points"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back To Points
              </Link>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-100 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                {canEdit ? "Resume Builder" : "Resume Preview"}
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                {canEdit
                  ? "Build a professional student resume from your profile and achievements"
                  : "Preview how your student resume will look before the 100-point unlock"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                {canEdit
                  ? "Save a structured resume draft, switch between two templates, import resume-friendly achievements from your student points section, and download it as a PDF using the print layout."
                  : "Students below 100 total points can still explore the resume preview, study the section layout, and understand exactly what the full builder unlocks later."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[430px]">
              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {canEdit ? "Save Status" : "Resume Access"}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {canEdit
                    ? saveState === "saving"
                      ? "Saving..."
                      : saveState === "error"
                        ? "Needs attention"
                        : "Draft ready"
                    : accessInfo.title}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {canEdit
                    ? saveMessage ||
                      (lastSavedAt
                        ? `Last saved ${formatSavedAt(lastSavedAt)}`
                        : "Your draft will stay linked to your student account.")
                    : accessInfo.description}
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {canEdit ? "PDF Download" : "Unlock Progress"}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {canEdit
                    ? "Print-ready preview included"
                    : `${currentPoints}/${TOTAL_STUDENT_POINTS} points`}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {canEdit
                    ? "Use the download button below and save the print preview as PDF."
                    : pointsRemaining > 0
                      ? `${pointsRemaining} more point${
                          pointsRemaining === 1 ? "" : "s"
                        } needed to unlock full resume editing, imports, and PDF download.`
                      : "Your full resume builder is ready to unlock."}
                </p>
                {!canEdit ? (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{ width: `${previewProgress}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {canEdit ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <GhostButton onClick={handleSave} className="border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:text-white">
                <Save className="h-4 w-4" />
                Save Draft
              </GhostButton>
              <GhostButton onClick={handleImportFromPoints}>
                <Wand2 className="h-4 w-4" />
                Import From Student Points
              </GhostButton>
              <GhostButton onClick={handlePrint}>
                <Download className="h-4 w-4" />
                Download PDF
              </GhostButton>
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900 shadow-sm">
              <span className="font-semibold">Preview mode:</span> Students can
              see the resume design, section order, and sample content right now.
              Full editing, imports, and PDF download turn on at{" "}
              {RESUME_BUILDER_UNLOCK_POINTS}/{TOTAL_STUDENT_POINTS} total
              student points.
            </div>
          )}

          <div
            id="unlock-guide"
            className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50/80 p-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              Points To Resume Guide
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              {RESUME_POINTS_UNLOCK_NOTE}
            </p>
            <div className="mt-4 overflow-x-auto rounded-[20px] border border-white/80 bg-white/90">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50/90 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Resume Function</th>
                    <th className="px-4 py-3">Rule</th>
                    <th className="px-4 py-3">Current Status</th>
                    <th className="px-4 py-3">Student Benefit</th>
                  </tr>
                </thead>
                <tbody>
                  {resumePointsGuideRows.map((item) => (
                    <tr
                      key={item.key}
                      className="border-t border-slate-100 align-top"
                    >
                      <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                        {item.feature}
                      </td>
                      <td className="px-4 py-4 text-sm leading-6 text-slate-600">
                        {item.requirement}
                      </td>
                      <td className="px-4 py-4 text-sm leading-6 text-slate-600">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                            item.currentStatus.startsWith("Available now") ||
                            item.currentStatus.startsWith("Unlocked")
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.currentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm leading-6 text-slate-600">
                        {item.benefit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {resume ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.9fr)]">
            {canEdit ? (
              <div className="resume-builder-shell space-y-6">
              <FormCard
                title="Resume Setup"
                description="Choose the template, color accent, and whether the profile photo should appear in the final resume."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Template">
                    <select
                      value={resume.templateKey}
                      onChange={(e) =>
                        setResume((current) => ({
                          ...current,
                          templateKey: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
                    >
                      {RESUME_TEMPLATE_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Status">
                    <select
                      value={resume.status}
                      onChange={(e) =>
                        setResume((current) => ({
                          ...current,
                          status: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="completed">Completed</option>
                    </select>
                  </Field>

                  <Field label="Accent Color">
                    <select
                      value={resume.preferences?.accentColor || "slate"}
                      onChange={(e) => setPreferencesField("accentColor", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white"
                    >
                      {RESUME_ACCENT_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Photo">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(resume.preferences?.showPhoto)}
                        onChange={(e) => setPreferencesField("showPhoto", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Show profile photo in preview and PDF
                    </label>
                  </Field>
                </div>
              </FormCard>

              <FormCard
                title="Personal Information"
                description="These fields are auto-filled from the student profile where possible, and you can adjust them for resume use."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Full Name">
                    <Input
                      value={resume.personal?.fullName || ""}
                      onChange={(e) => setPersonalField("fullName", e.target.value)}
                    />
                  </Field>
                  <Field label="Headline">
                    <Input
                      value={resume.headline || ""}
                      onChange={(e) =>
                        setResume((current) => ({
                          ...current,
                          headline: e.target.value,
                        }))
                      }
                      placeholder="Example: BPT Student | Rehabilitation and Patient Care"
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      value={resume.personal?.email || ""}
                      onChange={(e) => setPersonalField("email", e.target.value)}
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      value={resume.personal?.phone || ""}
                      onChange={(e) => setPersonalField("phone", e.target.value)}
                    />
                  </Field>
                  <Field label="Address">
                    <Input
                      value={resume.personal?.address || ""}
                      onChange={(e) => setPersonalField("address", e.target.value)}
                    />
                  </Field>
                  <Field label="City">
                    <Input
                      value={resume.personal?.city || ""}
                      onChange={(e) => setPersonalField("city", e.target.value)}
                    />
                  </Field>
                  <Field label="State">
                    <Input
                      value={resume.personal?.state || ""}
                      onChange={(e) => setPersonalField("state", e.target.value)}
                    />
                  </Field>
                  <Field label="Enrollment Number">
                    <Input
                      value={resume.personal?.enrollmentNo || ""}
                      onChange={(e) => setPersonalField("enrollmentNo", e.target.value)}
                    />
                  </Field>
                  <Field label="Course">
                    <Input
                      value={resume.personal?.course || ""}
                      onChange={(e) => setPersonalField("course", e.target.value)}
                    />
                  </Field>
                  <Field label="Year">
                    <Input
                      type="number"
                      min="1"
                      max="6"
                      value={resume.personal?.year ?? ""}
                      onChange={(e) =>
                        setPersonalField(
                          "year",
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                    />
                  </Field>
                  <Field label="LinkedIn">
                    <Input
                      value={resume.personal?.linkedin || ""}
                      onChange={(e) => setPersonalField("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </Field>
                  <Field label="GitHub">
                    <Input
                      value={resume.personal?.github || ""}
                      onChange={(e) => setPersonalField("github", e.target.value)}
                      placeholder="https://github.com/..."
                    />
                  </Field>
                  <Field label="Portfolio">
                    <Input
                      value={resume.personal?.portfolio || ""}
                      onChange={(e) => setPersonalField("portfolio", e.target.value)}
                      placeholder="https://your-portfolio.com"
                    />
                  </Field>
                  <Field label="Profile Image URL" hint="This is auto-filled from your student profile image when available.">
                    <Input
                      value={resume.personal?.profileImage || ""}
                      onChange={(e) => setPersonalField("profileImage", e.target.value)}
                    />
                  </Field>
                </div>
              </FormCard>

              <FormCard
                title="Summary"
                description="Write a short and professional overview that explains your academic focus, strengths, and career direction."
              >
                <Field label="Professional Summary">
                  <Textarea
                    rows={5}
                    value={resume.summary || ""}
                    onChange={(e) =>
                      setResume((current) => ({
                        ...current,
                        summary: e.target.value,
                      }))
                    }
                    placeholder="Example: Dedicated healthcare student with strong patient care interest, classroom discipline, and growing experience in rehabilitation support and academic projects."
                  />
                </Field>
              </FormCard>

              <FormCard
                title="Education"
                description="Add your current program and any previous schooling or academic milestones."
                action={
                  <GhostButton onClick={() => addListItem("education", "education")}>
                    <Plus className="h-4 w-4" />
                    Add Education
                  </GhostButton>
                }
              >
                {(resume.education || []).map((item, index) => (
                  <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Education Entry {index + 1}
                      </p>
                      <GhostButton
                        onClick={() => removeListItem("education", index)}
                        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </GhostButton>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="Institution">
                        <Input
                          value={item.institution || ""}
                          onChange={(e) =>
                            updateListItem("education", index, "institution", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Course / Degree">
                        <Input
                          value={item.course || ""}
                          onChange={(e) =>
                            updateListItem("education", index, "course", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Location">
                        <Input
                          value={item.location || ""}
                          onChange={(e) =>
                            updateListItem("education", index, "location", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Score / CGPA / Percentage">
                        <Input
                          value={item.score || ""}
                          onChange={(e) =>
                            updateListItem("education", index, "score", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Start Year">
                        <Input
                          value={item.startYear || ""}
                          onChange={(e) =>
                            updateListItem("education", index, "startYear", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="End Year">
                        <Input
                          value={item.endYear || ""}
                          onChange={(e) =>
                            updateListItem("education", index, "endYear", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                    <div className="mt-4">
                      <Field label="Description">
                        <Textarea
                          rows={3}
                          value={item.description || ""}
                          onChange={(e) =>
                            updateListItem("education", index, "description", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </FormCard>

              <FormCard
                title="Skills"
                description="Enter comma-separated skills so they appear cleanly in the resume preview."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Technical Skills">
                    <Textarea
                      rows={3}
                      value={toCsv(resume.skills?.technicalSkills)}
                      onChange={(e) =>
                        setResume((current) => ({
                          ...current,
                          skills: {
                            ...(current.skills || {}),
                            technicalSkills: fromCsv(e.target.value),
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Tools">
                    <Textarea
                      rows={3}
                      value={toCsv(resume.skills?.tools)}
                      onChange={(e) =>
                        setResume((current) => ({
                          ...current,
                          skills: {
                            ...(current.skills || {}),
                            tools: fromCsv(e.target.value),
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Soft Skills">
                    <Textarea
                      rows={3}
                      value={toCsv(resume.skills?.softSkills)}
                      onChange={(e) =>
                        setResume((current) => ({
                          ...current,
                          skills: {
                            ...(current.skills || {}),
                            softSkills: fromCsv(e.target.value),
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Languages">
                    <Textarea
                      rows={3}
                      value={toCsv(resume.skills?.languages)}
                      onChange={(e) =>
                        setResume((current) => ({
                          ...current,
                          skills: {
                            ...(current.skills || {}),
                            languages: fromCsv(e.target.value),
                          },
                        }))
                      }
                    />
                  </Field>
                </div>
              </FormCard>

              <FormCard
                title="Projects"
                description="Show your strongest academic, technical, clinical, or personal projects with measurable details."
                action={
                  <GhostButton onClick={() => addListItem("projects", "project")}>
                    <Plus className="h-4 w-4" />
                    Add Project
                  </GhostButton>
                }
              >
                {(resume.projects || []).map((item, index) => (
                  <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Project {index + 1}
                      </p>
                      <GhostButton
                        onClick={() => removeListItem("projects", index)}
                        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </GhostButton>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="Project Title">
                        <Input
                          value={item.title || ""}
                          onChange={(e) =>
                            updateListItem("projects", index, "title", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Role">
                        <Input
                          value={item.role || ""}
                          onChange={(e) =>
                            updateListItem("projects", index, "role", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Start Date">
                        <Input
                          value={item.startDate || ""}
                          onChange={(e) =>
                            updateListItem("projects", index, "startDate", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="End Date">
                        <Input
                          value={item.endDate || ""}
                          onChange={(e) =>
                            updateListItem("projects", index, "endDate", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Project Link">
                        <Input
                          value={item.link || ""}
                          onChange={(e) =>
                            updateListItem("projects", index, "link", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Tech Stack" hint="Comma-separated">
                        <Input
                          value={toCsv(item.techStack)}
                          onChange={(e) =>
                            updateListItem("projects", index, "techStack", fromCsv(e.target.value))
                          }
                        />
                      </Field>
                    </div>
                    <div className="mt-4 grid gap-4">
                      <Field label="Description">
                        <Textarea
                          rows={3}
                          value={item.description || ""}
                          onChange={(e) =>
                            updateListItem("projects", index, "description", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Bullet Points" hint="Write one achievement per line.">
                        <Textarea
                          rows={4}
                          value={toLines(item.bullets)}
                          onChange={(e) =>
                            updateListItem("projects", index, "bullets", fromLines(e.target.value))
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </FormCard>

              <FormCard
                title="Internships And Training"
                description="Use this section for internships, clinical postings, industrial training, or workshops with direct experience."
                action={
                  <GhostButton onClick={() => addListItem("internships", "internship")}>
                    <Plus className="h-4 w-4" />
                    Add Internship
                  </GhostButton>
                }
              >
                {(resume.internships || []).map((item, index) => (
                  <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Internship {index + 1}
                      </p>
                      <GhostButton
                        onClick={() => removeListItem("internships", index)}
                        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </GhostButton>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="Organization">
                        <Input
                          value={item.organization || ""}
                          onChange={(e) =>
                            updateListItem("internships", index, "organization", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Role">
                        <Input
                          value={item.role || ""}
                          onChange={(e) =>
                            updateListItem("internships", index, "role", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Duration Label">
                        <Input
                          value={item.duration || ""}
                          onChange={(e) =>
                            updateListItem("internships", index, "duration", e.target.value)
                          }
                          placeholder="Example: 6 weeks"
                        />
                      </Field>
                      <Field label="Start Date">
                        <Input
                          value={item.startDate || ""}
                          onChange={(e) =>
                            updateListItem("internships", index, "startDate", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="End Date">
                        <Input
                          value={item.endDate || ""}
                          onChange={(e) =>
                            updateListItem("internships", index, "endDate", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                    <div className="mt-4 grid gap-4">
                      <Field label="Description">
                        <Textarea
                          rows={3}
                          value={item.description || ""}
                          onChange={(e) =>
                            updateListItem("internships", index, "description", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Bullet Points" hint="Write one achievement per line.">
                        <Textarea
                          rows={4}
                          value={toLines(item.bullets)}
                          onChange={(e) =>
                            updateListItem("internships", index, "bullets", fromLines(e.target.value))
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </FormCard>

              <FormCard
                title="Certifications"
                description="Add certifications, courses, workshops, or external credentials that strengthen your profile."
                action={
                  <GhostButton onClick={() => addListItem("certifications", "certification")}>
                    <Plus className="h-4 w-4" />
                    Add Certification
                  </GhostButton>
                }
              >
                {(resume.certifications || []).map((item, index) => (
                  <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Certification {index + 1}
                      </p>
                      <GhostButton
                        onClick={() => removeListItem("certifications", index)}
                        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </GhostButton>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="Title">
                        <Input
                          value={item.title || ""}
                          onChange={(e) =>
                            updateListItem("certifications", index, "title", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Issuer">
                        <Input
                          value={item.issuer || ""}
                          onChange={(e) =>
                            updateListItem("certifications", index, "issuer", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Issued On">
                        <Input
                          value={item.issuedOn || ""}
                          onChange={(e) =>
                            updateListItem("certifications", index, "issuedOn", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Link">
                        <Input
                          value={item.link || ""}
                          onChange={(e) =>
                            updateListItem("certifications", index, "link", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                    <div className="mt-4">
                      <Field label="Description">
                        <Textarea
                          rows={3}
                          value={item.description || ""}
                          onChange={(e) =>
                            updateListItem("certifications", index, "description", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </FormCard>

              <FormCard
                title="Achievements"
                description="This is where imported student-point achievements will appear. Right now imports come from the live attendance category, and you can also add your own academic or extracurricular wins."
                action={
                  <div className="flex flex-wrap gap-3">
                    <GhostButton onClick={handleImportFromPoints}>
                      <Wand2 className="h-4 w-4" />
                      Import Student Points
                    </GhostButton>
                    <GhostButton onClick={() => addListItem("achievements", "achievement")}>
                      <Plus className="h-4 w-4" />
                      Add Achievement
                    </GhostButton>
                  </div>
                }
              >
                {(resume.achievements || []).map((item, index) => (
                  <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Achievement {index + 1}
                        </p>
                        {item.isImportedFromPoints ? (
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                            Imported from student points
                          </p>
                        ) : null}
                      </div>
                      <GhostButton
                        onClick={() => removeListItem("achievements", index)}
                        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </GhostButton>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="Title">
                        <Input
                          value={item.title || ""}
                          onChange={(e) =>
                            updateListItem("achievements", index, "title", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Source">
                        <Input
                          value={item.source || ""}
                          onChange={(e) =>
                            updateListItem("achievements", index, "source", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                    <div className="mt-4">
                      <Field label="Description">
                        <Textarea
                          rows={3}
                          value={item.description || ""}
                          onChange={(e) =>
                            updateListItem("achievements", index, "description", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </FormCard>

              <FormCard
                title="Activities"
                description="Use this for volunteer work, clubs, workshops, seminars, or any participation worth highlighting."
                action={
                  <GhostButton onClick={() => addListItem("activities", "activity")}>
                    <Plus className="h-4 w-4" />
                    Add Activity
                  </GhostButton>
                }
              >
                {(resume.activities || []).map((item, index) => (
                  <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Activity {index + 1}
                      </p>
                      <GhostButton
                        onClick={() => removeListItem("activities", index)}
                        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </GhostButton>
                    </div>
                    <div className="mt-4 grid gap-4">
                      <Field label="Title">
                        <Input
                          value={item.title || ""}
                          onChange={(e) =>
                            updateListItem("activities", index, "title", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="Description">
                        <Textarea
                          rows={3}
                          value={item.description || ""}
                          onChange={(e) =>
                            updateListItem("activities", index, "description", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </FormCard>
              </div>
            ) : (
              <div className="resume-builder-shell space-y-6">
                <FormCard
                  title="Preview Mode"
                  description="Students can study the full resume layout before the builder unlocks. The preview on the right shows the same type of structure that will become editable at 100 points."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Current Progress
                      </p>
                      <p className="mt-3 text-3xl font-bold text-slate-950">
                        {currentPoints}/{TOTAL_STUDENT_POINTS}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {accessInfo.description}
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Preview Source
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {accessInfo.usingDemoPreview
                          ? "Sample resume preview"
                          : "Your saved resume in preview mode"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {accessInfo.usingDemoPreview
                          ? "A sample profile is shown so students can understand the final design, spacing, and section flow before unlocking the builder."
                          : "Your saved resume is still visible here, but editing is locked until the full 100-point rule is met again."}
                      </p>
                    </div>
                  </div>
                </FormCard>

                <FormCard
                  title="Resume Table Of Contents"
                  description="This is the structure shown in the preview and later editable inside the full resume builder."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    {PREVIEW_SECTION_CONTENTS.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-950">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </FormCard>

                <FormCard
                  title="What Unlocks At 100 Points"
                  description="Once the student reaches the full points milestone, the preview turns into a working builder."
                >
                  <div className="space-y-3">
                    {BUILDER_UNLOCK_FEATURES.map((item) => (
                      <div
                        key={item}
                        className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3"
                      >
                        <p className="text-sm font-medium leading-6 text-slate-700">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </FormCard>
              </div>
            )}

            <div className="resume-preview-pane xl:sticky xl:top-6 xl:self-start">
              <div className="mb-4 flex items-center justify-between gap-3 rounded-[24px] border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {canEdit ? "Live Preview" : "Resume Preview"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {canEdit
                        ? "This preview is also used for print and PDF download."
                        : accessInfo.usingDemoPreview
                          ? "This sample shows how the unlocked resume can look with all major sections."
                          : "Your saved resume remains visible here while the builder is locked."}
                    </p>
                  </div>
                </div>

                {canEdit ? (
                  <div className="flex gap-2">
                    <GhostButton onClick={handleSave}>
                      <Save className="h-4 w-4" />
                      Save
                    </GhostButton>
                    <GhostButton onClick={handlePrint}>
                      <Download className="h-4 w-4" />
                      PDF
                    </GhostButton>
                  </div>
                ) : (
                  <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Preview only
                  </span>
                )}
              </div>

              <div id="resume-print-sheet">
                <StudentResumePreview resume={resume} />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        @page {
          size: A4;
          margin: 14mm;
        }

        @media print {
          body {
            background: white !important;
          }

          .resume-builder-shell,
          .resume-preview-pane > div:first-child {
            display: none !important;
          }

          body * {
            visibility: hidden;
          }

          #resume-print-sheet,
          #resume-print-sheet * {
            visibility: visible;
          }

          #resume-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          #resume-print-sheet article {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
