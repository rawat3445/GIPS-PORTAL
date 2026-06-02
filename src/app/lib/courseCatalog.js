export const COURSE_NAMES = {
  BPT: "Bachelor of Physiotherapy",
  BOPTOM: "Bachelor of Optometry",
  BMRIT: "Bachelor of Medical Radiology and Imaging Technology",
  DOPTOM: "Diploma in Optometry",
  BOTT: "Bachelor of Operation Theatre Technology",
};

export const COURSE_OPTIONS = Object.entries(COURSE_NAMES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const YEAR_OPTIONS = [1, 2, 3, 4].map((value) => ({
  value,
  label: `Year ${value}`,
}));

export const RESOURCE_TYPE_OPTIONS = [
  { value: "note", label: "Notes" },
  { value: "pdf", label: "PDF" },
  { value: "link", label: "Link" },
  { value: "video", label: "Video" },
  { value: "doc", label: "Document" },
];

const RESOURCE_TYPE_SET = new Set(
  RESOURCE_TYPE_OPTIONS.map((option) => option.value),
);

function safeTrim(value) {
  return String(value || "").trim();
}

function normalizePositiveNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

export function getCourseName(code) {
  const normalizedCode = safeTrim(code).toUpperCase();
  return COURSE_NAMES[normalizedCode] || normalizedCode || "Course";
}

export function getDefaultSemesterLabel(year) {
  const normalizedYear = Number(year);

  if (normalizedYear === 1) return "Year 1 Foundation Track";
  if (normalizedYear === 2) return "Year 2 Applied Learning Track";
  if (normalizedYear === 3) return "Year 3 Advanced Clinical Track";
  if (normalizedYear === 4) return "Year 4 Internship and Exam Track";
  return "Academic Track";
}

export function createEmptyMaterial() {
  return {
    title: "",
    type: "note",
    storageProvider: "",
    resourceUrl: "",
    resourcePublicId: "",
    uploadedFileName: "",
    uploadedMimeType: "",
    description: "",
    isImportant: false,
  };
}

export function createEmptySubject() {
  return {
    code: "",
    name: "",
    credits: "",
    facultyId: "",
    facultyName: "",
    facultyEmail: "",
    description: "",
    materials: [],
  };
}

export function createEmptyAnnouncement() {
  return {
    title: "",
    summary: "",
    tag: "",
    link: "",
  };
}

export function createEmptyCourseCatalog({ course = "", year = "" } = {}) {
  const normalizedCourse = safeTrim(course).toUpperCase();
  const normalizedYear = Number(year) || "";

  return {
    course: normalizedCourse,
    year: normalizedYear,
    publishStatus: "draft",
    semesterLabel: normalizedYear
      ? getDefaultSemesterLabel(normalizedYear)
      : "",
    title:
      normalizedCourse && normalizedYear
        ? `${getCourseName(normalizedCourse)} Year ${normalizedYear} Academic Hub`
        : "",
    overview: "",
    coordinatorName: "",
    coordinatorEmail: "",
    supportNote: "",
    highlights: [],
    subjects: [],
    announcements: [],
  };
}

export function sanitizeCourseCatalogPayload(input) {
  const course = safeTrim(input?.course).toUpperCase();
  const year = Number(input?.year);

  const highlightsSource = Array.isArray(input?.highlights)
    ? input.highlights
    : String(input?.highlights || "").split(/\r?\n|,/);

  const highlights = highlightsSource
    .map((value) => safeTrim(value))
    .filter(Boolean)
    .slice(0, 10);

  const subjects = Array.isArray(input?.subjects)
    ? input.subjects
        .map((subject) => {
          const materials = Array.isArray(subject?.materials)
            ? subject.materials
                .map((material) => ({
                  title: safeTrim(material?.title),
                  type: RESOURCE_TYPE_SET.has(
                    safeTrim(material?.type).toLowerCase(),
                  )
                    ? safeTrim(material?.type).toLowerCase()
                    : "note",
                  storageProvider: ["r2", "gcs"].includes(
                    safeTrim(material?.storageProvider).toLowerCase(),
                  )
                    ? safeTrim(material?.storageProvider).toLowerCase()
                    : "",
                  resourceUrl: safeTrim(material?.resourceUrl),
                  resourcePublicId: safeTrim(material?.resourcePublicId),
                  uploadedFileName: safeTrim(material?.uploadedFileName),
                  uploadedMimeType: safeTrim(material?.uploadedMimeType),
                  description: safeTrim(material?.description),
                  isImportant: Boolean(material?.isImportant),
                }))
                .filter(
                  (material) =>
                    material.title &&
                    (material.resourceUrl || material.resourcePublicId),
                )
            : [];

          const normalizedSubject = {
            code: safeTrim(subject?.code).toUpperCase(),
            name: safeTrim(subject?.name),
            credits: normalizePositiveNumber(subject?.credits),
            facultyId: safeTrim(subject?.facultyId),
            facultyName: safeTrim(subject?.facultyName),
            facultyEmail: safeTrim(subject?.facultyEmail).toLowerCase(),
            description: safeTrim(subject?.description),
            materials,
          };

          return normalizedSubject.name ? normalizedSubject : null;
        })
        .filter(Boolean)
    : [];

  const announcements = Array.isArray(input?.announcements)
    ? input.announcements
        .map((announcement) => ({
          title: safeTrim(announcement?.title),
          summary: safeTrim(announcement?.summary),
          tag: safeTrim(announcement?.tag),
          link: safeTrim(announcement?.link),
        }))
        .filter((announcement) => announcement.title)
    : [];

  return {
    course,
    year,
    publishStatus:
      safeTrim(input?.publishStatus).toLowerCase() === "published"
        ? "published"
        : "draft",
    semesterLabel:
      safeTrim(input?.semesterLabel) || getDefaultSemesterLabel(year),
    title:
      safeTrim(input?.title) ||
      `${getCourseName(course)} Year ${year} Academic Hub`,
    overview: safeTrim(input?.overview),
    coordinatorName: safeTrim(input?.coordinatorName),
    coordinatorEmail: safeTrim(input?.coordinatorEmail).toLowerCase(),
    supportNote: safeTrim(input?.supportNote),
    highlights,
    subjects,
    announcements,
  };
}
