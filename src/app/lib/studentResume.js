export const RESUME_TEMPLATE_OPTIONS = [
  { key: "ats-clean", label: "ATS Clean" },
  { key: "modern-student", label: "Modern Student" },
];

export const RESUME_ACCENT_OPTIONS = [
  { key: "slate", label: "Slate" },
  { key: "blue", label: "Blue" },
  { key: "emerald", label: "Emerald" },
  { key: "amber", label: "Amber" },
];

export const DEFAULT_RESUME_SECTION_ORDER = [
  "summary",
  "education",
  "skills",
  "projects",
  "internships",
  "certifications",
  "achievements",
  "activities",
];

function safeString(value) {
  return String(value || "").trim();
}

function safeUrl(value) {
  return String(value || "").trim();
}

function safeNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function uniqueStringArray(values) {
  const uniqueValues = new Set();

  return (Array.isArray(values) ? values : [])
    .map((value) => safeString(value))
    .filter((value) => {
      if (!value) return false;
      const normalized = value.toLowerCase();
      if (uniqueValues.has(normalized)) return false;
      uniqueValues.add(normalized);
      return true;
    });
}

function createItemId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function createResumeDraft(student = {}) {
  const course = safeString(student.course).toUpperCase();
  const year = safeNumber(student.year);
  const fullName = safeString(student.name);
  const email = safeString(student.email).toLowerCase();
  const phone = safeString(student.phone);
  const enrollmentNo = safeString(student.enrollmentNo).toUpperCase();
  const profileImage = safeString(student.profileImage);

  return {
    status: "draft",
    templateKey: "ats-clean",
    personal: {
      fullName,
      email,
      phone,
      address: "",
      city: "",
      state: "",
      linkedin: "",
      github: "",
      portfolio: "",
      profileImage,
      enrollmentNo,
      course,
      year,
    },
    headline: course ? `${course} Student` : "Student",
    summary: "",
    education: [
      {
        id: createItemId("education"),
        institution: "GIPS",
        course,
        location: "",
        startYear: "",
        endYear: "",
        score: "",
        description: year ? `Currently studying in Year ${year}.` : "",
      },
    ],
    skills: {
      technicalSkills: [],
      softSkills: [],
      tools: [],
      languages: [],
    },
    projects: [],
    internships: [],
    certifications: [],
    achievements: [],
    activities: [],
    preferences: {
      accentColor: "slate",
      fontScale: "md",
      sectionOrder: [...DEFAULT_RESUME_SECTION_ORDER],
      showPhoto: true,
    },
  };
}

function normalizeEducationItem(item = {}) {
  return {
    id: safeString(item.id) || createItemId("education"),
    institution: safeString(item.institution),
    course: safeString(item.course),
    location: safeString(item.location),
    startYear: safeString(item.startYear),
    endYear: safeString(item.endYear),
    score: safeString(item.score),
    description: safeString(item.description),
  };
}

function normalizeProjectItem(item = {}) {
  return {
    id: safeString(item.id) || createItemId("project"),
    title: safeString(item.title),
    role: safeString(item.role),
    techStack: uniqueStringArray(item.techStack),
    startDate: safeString(item.startDate),
    endDate: safeString(item.endDate),
    description: safeString(item.description),
    bullets: uniqueStringArray(item.bullets),
    link: safeUrl(item.link),
  };
}

function normalizeInternshipItem(item = {}) {
  return {
    id: safeString(item.id) || createItemId("internship"),
    organization: safeString(item.organization),
    role: safeString(item.role),
    duration: safeString(item.duration),
    startDate: safeString(item.startDate),
    endDate: safeString(item.endDate),
    description: safeString(item.description),
    bullets: uniqueStringArray(item.bullets),
  };
}

function normalizeCertificationItem(item = {}) {
  return {
    id: safeString(item.id) || createItemId("certification"),
    title: safeString(item.title),
    issuer: safeString(item.issuer),
    issuedOn: safeString(item.issuedOn),
    link: safeUrl(item.link),
    description: safeString(item.description),
  };
}

function normalizeAchievementItem(item = {}) {
  return {
    id: safeString(item.id) || createItemId("achievement"),
    title: safeString(item.title),
    description: safeString(item.description),
    source: safeString(item.source),
    sourceKey: safeString(item.sourceKey),
    isImportedFromPoints: Boolean(item.isImportedFromPoints),
  };
}

function normalizeActivityItem(item = {}) {
  return {
    id: safeString(item.id) || createItemId("activity"),
    title: safeString(item.title),
    description: safeString(item.description),
  };
}

export function normalizeResumePayload(payload = {}, student = {}) {
  const fallbackDraft = createResumeDraft(student);
  const personal = payload?.personal || {};
  const preferences = payload?.preferences || {};
  const templateKey = safeString(payload?.templateKey);
  const accentColor = safeString(preferences.accentColor);
  const sectionOrder = uniqueStringArray(preferences.sectionOrder);

  return {
    status: safeString(payload?.status) === "completed" ? "completed" : "draft",
    templateKey:
      RESUME_TEMPLATE_OPTIONS.find((option) => option.key === templateKey)?.key ||
      fallbackDraft.templateKey,
    personal: {
      fullName: safeString(personal.fullName) || fallbackDraft.personal.fullName,
      email: safeString(personal.email).toLowerCase() || fallbackDraft.personal.email,
      phone: safeString(personal.phone) || fallbackDraft.personal.phone,
      address: safeString(personal.address),
      city: safeString(personal.city),
      state: safeString(personal.state),
      linkedin: safeUrl(personal.linkedin),
      github: safeUrl(personal.github),
      portfolio: safeUrl(personal.portfolio),
      profileImage:
        safeUrl(personal.profileImage) || fallbackDraft.personal.profileImage,
      enrollmentNo:
        safeString(personal.enrollmentNo).toUpperCase() ||
        fallbackDraft.personal.enrollmentNo,
      course:
        safeString(personal.course).toUpperCase() || fallbackDraft.personal.course,
      year: safeNumber(personal.year) ?? fallbackDraft.personal.year,
    },
    headline: safeString(payload?.headline),
    summary: safeString(payload?.summary),
    education: (Array.isArray(payload?.education) ? payload.education : [])
      .map(normalizeEducationItem)
      .filter((item) => item.institution || item.course || item.score),
    skills: {
      technicalSkills: uniqueStringArray(payload?.skills?.technicalSkills),
      softSkills: uniqueStringArray(payload?.skills?.softSkills),
      tools: uniqueStringArray(payload?.skills?.tools),
      languages: uniqueStringArray(payload?.skills?.languages),
    },
    projects: (Array.isArray(payload?.projects) ? payload.projects : [])
      .map(normalizeProjectItem)
      .filter(
        (item) =>
          item.title || item.role || item.description || item.bullets.length,
      ),
    internships: (Array.isArray(payload?.internships) ? payload.internships : [])
      .map(normalizeInternshipItem)
      .filter(
        (item) =>
          item.organization ||
          item.role ||
          item.description ||
          item.bullets.length,
      ),
    certifications: (
      Array.isArray(payload?.certifications) ? payload.certifications : []
    )
      .map(normalizeCertificationItem)
      .filter((item) => item.title || item.issuer || item.description),
    achievements: (Array.isArray(payload?.achievements) ? payload.achievements : [])
      .map(normalizeAchievementItem)
      .filter((item) => item.title || item.description),
    activities: (Array.isArray(payload?.activities) ? payload.activities : [])
      .map(normalizeActivityItem)
      .filter((item) => item.title || item.description),
    preferences: {
      accentColor:
        RESUME_ACCENT_OPTIONS.find((option) => option.key === accentColor)?.key ||
        fallbackDraft.preferences.accentColor,
      fontScale: safeString(preferences.fontScale) || "md",
      sectionOrder: sectionOrder.length
        ? sectionOrder
        : [...DEFAULT_RESUME_SECTION_ORDER],
      showPhoto:
        typeof preferences.showPhoto === "boolean"
          ? preferences.showPhoto
          : true,
    },
  };
}

function formatPercentage(value) {
  const numericValue = Number(value || 0);
  return `${numericValue.toFixed(1)}%`;
}

export const TOTAL_STUDENT_POINTS = 100;
export const RESUME_BUILDER_UNLOCK_POINTS = TOTAL_STUDENT_POINTS;
export const RESUME_BUILDER_UPDATE_POINTS = TOTAL_STUDENT_POINTS;

export const RESUME_POINTS_UNLOCK_NOTE =
  `Every student can open the resume preview right now. Full resume editing, saving, student-point imports, and PDF download unlock at ${RESUME_BUILDER_UNLOCK_POINTS} total student points. Until then, students can explore the preview layout and unlock guide.`;

const RESUME_PREVIEW_ACCESS_RULE = {
  key: "preview-access",
  feature: "Resume preview",
  requirement: "Available to every student",
  benefit:
    "Open the resume page, see the layout, understand how sections work, and view a live sample before the builder is unlocked.",
};

const RESUME_BUILDER_ACCESS_RULE = {
  key: "builder-access",
  feature: "Resume builder access",
  requirement: "Available to every student",
  benefit:
    "Open the resume page, explore the resume layout, and see which points-based achievements can later be imported into the full builder.",
};

const RESUME_BUILDER_UNLOCK_RULE = {
  key: "builder-unlock",
  feature: "Resume builder first unlock",
  requirement: `${RESUME_BUILDER_UNLOCK_POINTS} total student points`,
  benefit:
    "Start editing your own resume, save your first draft, import points-based achievements, and download the PDF.",
};

const RESUME_BUILDER_UPDATES_RULE = {
  key: "builder-updates",
  feature: "Further resume updates",
  requirement: `${RESUME_BUILDER_UPDATE_POINTS} total student points after the first unlock`,
  benefit:
    "Keep editing the saved draft, refresh imported achievements, and download the latest PDF after the builder has been unlocked once.",
};

const RESUME_ACHIEVEMENT_RULES = {
  coverageAchievement: {
    key: "coverage-achievement",
    feature: "Import attendance coverage achievement",
    requirement: "75%+ attendance coverage or 11/15 coverage points",
    benefit:
      "Adds one resume achievement line about strong overall attendance coverage.",
    minCoveragePoints: 11,
  },
  streakAchievement: {
    key: "streak-achievement",
    feature: "Import streak achievement",
    requirement: "3+ day current-month streak or 1/5 streak points",
    benefit:
      "Adds one resume achievement line about attendance consistency streak performance.",
    minStreakPoints: 1,
  },
  monthlyConsistencyAchievement: {
    key: "monthly-consistency-achievement",
    feature: "Import monthly consistency achievement",
    requirement: "1+ qualified month or 1/5 monthly consistency points",
    benefit:
      "Adds one resume achievement line about sustained month-level attendance consistency.",
    minMonthlyConsistencyPoints: 1,
  },
  strongProfileAchievement: {
    key: "strong-profile-achievement",
    feature: "Import strong attendance profile achievement",
    requirement: "18+/25 attendance category points",
    benefit:
      "Adds one high-value resume achievement line showing a strong attendance-category profile.",
    minAttendanceCategoryPoints: 18,
  },
};

export const RESUME_POINTS_RULES = {
  previewAccess: RESUME_PREVIEW_ACCESS_RULE,
  builderAccess: RESUME_BUILDER_ACCESS_RULE,
  builderUnlock: RESUME_BUILDER_UNLOCK_RULE,
  builderUpdates: RESUME_BUILDER_UPDATES_RULE,
  ...RESUME_ACHIEVEMENT_RULES,
};

function getOverallStudentPoints(summary = {}) {
  const explicitOverallPoints = Number(
    summary?.overallFrameworkPoints ??
      summary?.overallPoints ??
      summary?.framework?.overallPoints,
  );

  if (Number.isFinite(explicitOverallPoints)) {
    return Math.max(0, explicitOverallPoints);
  }

  const attendanceCategoryPoints = Number(
    summary?.attendanceCategory?.totalPoints ??
      summary?.attendanceCategory?.earnedPoints ??
      summary?.leaderboard?.yourAttendanceCategoryPoints,
  );

  if (Number.isFinite(attendanceCategoryPoints)) {
    return Math.max(0, attendanceCategoryPoints);
  }

  return 0;
}

export function createResumePreviewDraft(student = {}) {
  const draft = createResumeDraft(student);
  const fullName = safeString(draft?.personal?.fullName) || "Student Name";
  const course = safeString(draft?.personal?.course) || "Course";
  const year = draft?.personal?.year ? `Year ${draft.personal.year}` : "Current Year";

  return normalizeResumePayload(
    {
      ...draft,
      templateKey: "modern-student",
      headline: `${course} Student | Resume Preview`,
      summary:
        "This is a preview-only sample that shows how your student resume can look after you unlock the builder with points. You will be able to edit your own summary, projects, skills, achievements, and activities once the builder is unlocked.",
      education: [
        {
          id: createItemId("education"),
          institution: "GIPS",
          course,
          location: "Greater Noida",
          startYear: "2024",
          endYear: "2028",
          score: "Current student profile",
          description: `${fullName} is currently studying in ${year}. This sample block shows how course details appear in the final resume.`,
        },
      ],
      skills: {
        technicalSkills: [
          "MS Office",
          "Academic Documentation",
          "Presentation Skills",
        ],
        softSkills: ["Communication", "Teamwork", "Time Management"],
        tools: ["Canva", "Google Workspace", "PowerPoint"],
        languages: ["English", "Hindi"],
      },
      projects: [
        {
          id: createItemId("project"),
          title: "Student Portfolio Preview Project",
          role: "Student Contributor",
          techStack: ["Research", "Documentation", "Presentation"],
          startDate: "Jan 2026",
          endDate: "Mar 2026",
          description:
            "Sample project content helps students understand where academic work, case studies, and practical projects will appear in the resume.",
          bullets: [
            "Shows how project titles, roles, and bullet highlights are displayed.",
            "Helps students plan what information they should prepare before unlocking the builder.",
          ],
          link: "",
        },
      ],
      internships: [
        {
          id: createItemId("internship"),
          organization: "Training / Internship Sample",
          role: "Practical Exposure",
          duration: "4 weeks",
          startDate: "",
          endDate: "",
          description:
            "Use this section later for internships, industrial training, workshops, or clinical postings.",
          bullets: [
            "Add responsibilities, tools used, and measurable learning outcomes.",
          ],
        },
      ],
      certifications: [
        {
          id: createItemId("certification"),
          title: "Certificate Or Workshop Preview",
          issuer: "Institute / Platform",
          issuedOn: "2026",
          link: "",
          description:
            "Certifications, short courses, and workshop achievements can be listed here once editing is unlocked.",
        },
      ],
      achievements: [
        {
          id: createItemId("achievement"),
          title: "Student Points Achievement Preview",
          description:
            "Imported achievements from the student points system will appear in this section after the resume builder is unlocked.",
          source: "Student Points Preview",
          sourceKey: "preview-points-achievement",
          isImportedFromPoints: true,
        },
      ],
      activities: [
        {
          id: createItemId("activity"),
          title: "Club / Seminar / Volunteer Activity Preview",
          description:
            "Use this area later for extracurricular participation, volunteering, seminars, or student leadership work.",
        },
      ],
      preferences: {
        ...draft.preferences,
        accentColor: "blue",
        showPhoto: true,
      },
    },
    student,
  );
}

export function buildResumeBuilderAccess(summary = {}, options = {}) {
  const currentPoints = Math.max(0, Math.round(getOverallStudentPoints(summary)));
  const hasUnlockedBefore = Boolean(
    options?.resumeBuilderUnlockedAt || options?.unlockedAt,
  );
  const qualifiesForFirstUnlock = currentPoints >= RESUME_BUILDER_UNLOCK_POINTS;
  const qualifiesForUpdates = currentPoints >= RESUME_BUILDER_UPDATE_POINTS;
  const canEdit =
    qualifiesForFirstUnlock || (hasUnlockedBefore && qualifiesForUpdates);

  let status = "preview-only";
  let title = "Preview Only";
  let description = `You can view the resume layout right now. Reach ${RESUME_BUILDER_UNLOCK_POINTS}/${TOTAL_STUDENT_POINTS} total student points to unlock editing, saving, importing, and PDF download.`;

  if (canEdit && !hasUnlockedBefore) {
    status = "ready-to-unlock";
    title = "Ready To Unlock";
    description = `You currently have ${currentPoints}/${TOTAL_STUDENT_POINTS} points, so you meet the full resume unlock rule. Save your first draft or import achievements to activate the builder.`;
  } else if (canEdit) {
    status = "builder-active";
    title = "Builder Active";
    description = `Your resume builder is active. Keep ${RESUME_BUILDER_UPDATE_POINTS}/${TOTAL_STUDENT_POINTS} total student points to continue editing, importing, and downloading.`;
  } else if (hasUnlockedBefore) {
    status = "update-locked";
    description = `Preview is still available, but editing is locked until you return to ${RESUME_BUILDER_UPDATE_POINTS}/${TOTAL_STUDENT_POINTS} total student points.`;
    title = "Update Locked";
  }

  return {
    status,
    title,
    description,
    canPreview: true,
    canEdit,
    hasUnlockedBefore,
    currentPoints,
    firstUnlockPoints: RESUME_BUILDER_UNLOCK_POINTS,
    updatePoints: RESUME_BUILDER_UPDATE_POINTS,
    qualifiesForFirstUnlock,
    qualifiesForUpdates,
    pointsNeededForFirstUnlock: Math.max(
      0,
      RESUME_BUILDER_UNLOCK_POINTS - currentPoints,
    ),
    pointsNeededForUpdate: Math.max(
      0,
      RESUME_BUILDER_UPDATE_POINTS - currentPoints,
    ),
  };
}

function getAttendanceCategoryStreakPoints(bestStreak) {
  const streak = Number(bestStreak || 0);

  if (streak >= 25) return 5;
  if (streak >= 15) return 4;
  if (streak >= 10) return 3;
  if (streak >= 6) return 2;
  if (streak >= 3) return 1;
  return 0;
}

function getAttendanceCategorySnapshot(summary = {}) {
  const attendanceCategory = summary?.attendanceCategory || {};
  const coveragePercentage = Number(
    summary?.attendanceScore?.confirmedPercentage ||
      summary?.overall?.confirmedPercentage ||
      0,
  );
  const sourceMonths = Array.isArray(summary?.pointsMonths)
    ? summary.pointsMonths
    : Array.isArray(summary?.months)
      ? summary.months
      : [];
  const computedQualifiedMonths = Array.isArray(sourceMonths)
    ? sourceMonths.filter((month) => Number(month?.scoreBonus || 0) > 0).length
    : 0;
  const qualifiedMonths = Number(
    attendanceCategory?.bonusMonthsCount ?? computedQualifiedMonths,
  );
  const coveragePoints = Number.isFinite(Number(attendanceCategory?.coveragePoints))
    ? Number(attendanceCategory.coveragePoints)
    : Math.min(15, Math.max(0, Math.round((coveragePercentage / 100) * 15)));
  const monthlyConsistencyPoints = Number.isFinite(
    Number(attendanceCategory?.monthlyConsistencyPoints),
  )
    ? Number(attendanceCategory.monthlyConsistencyPoints)
    : Math.min(5, qualifiedMonths);
  const bestStreak = Number(
    attendanceCategory?.bestStreak ?? summary?.streaks?.best ?? 0,
  );
  const streakPoints = Number.isFinite(Number(attendanceCategory?.streakPoints))
    ? Number(attendanceCategory.streakPoints)
    : getAttendanceCategoryStreakPoints(bestStreak);
  const totalPoints = Number.isFinite(Number(attendanceCategory?.totalPoints))
    ? Number(attendanceCategory.totalPoints)
    : coveragePoints + monthlyConsistencyPoints + streakPoints;

  return {
    coveragePercentage,
    coveragePoints,
    monthlyConsistencyPoints,
    qualifiedMonths,
    bestStreak,
    streakPoints,
    totalPoints,
  };
}

export function buildAchievementsFromAttendanceSummary(summary = {}) {
  const achievements = [];
  const {
    coveragePercentage,
    coveragePoints,
    monthlyConsistencyPoints,
    qualifiedMonths,
    bestStreak,
    streakPoints,
    totalPoints,
  } = getAttendanceCategorySnapshot(summary);

  if (
    coveragePoints >= RESUME_ACHIEVEMENT_RULES.coverageAchievement.minCoveragePoints
  ) {
    achievements.push({
      id: createItemId("achievement"),
      title: `Maintained ${formatPercentage(coveragePercentage)} attendance coverage`,
      description:
        "Converted strong attendance coverage into a resume-ready achievement from the live student points system.",
      source: "Student Points (Attendance)",
      sourceKey: `attendance-coverage-${Math.round(coveragePercentage)}`,
      isImportedFromPoints: true,
    });
  }

  if (streakPoints >= RESUME_ACHIEVEMENT_RULES.streakAchievement.minStreakPoints) {
    achievements.push({
      id: createItemId("achievement"),
      title: `Built a ${bestStreak}-day attendance consistency streak`,
      description:
        "Converted current-month attendance consistency into a resume-ready streak achievement.",
      source: "Student Points (Attendance)",
      sourceKey: `attendance-streak-${bestStreak}`,
      isImportedFromPoints: true,
    });
  }

  if (
    monthlyConsistencyPoints >=
    RESUME_ACHIEVEMENT_RULES.monthlyConsistencyAchievement.minMonthlyConsistencyPoints
  ) {
    achievements.push({
      id: createItemId("achievement"),
      title: `Maintained attendance consistency in ${qualifiedMonths} qualified month${
        qualifiedMonths === 1 ? "" : "s"
      }`,
      description:
        "Converted qualified month-level attendance consistency into a resume-friendly achievement line.",
      source: "Student Points (Attendance)",
      sourceKey: `attendance-monthly-consistency-${qualifiedMonths}`,
      isImportedFromPoints: true,
    });
  }

  if (
    totalPoints >=
      RESUME_ACHIEVEMENT_RULES.strongProfileAchievement
        .minAttendanceCategoryPoints
  ) {
    achievements.push({
      id: createItemId("achievement"),
      title: `Built a strong attendance category profile`,
      description:
        `Reached ${Math.round(totalPoints)}/25 live attendance-category points through strong coverage, monthly consistency, and streak performance.`,
      source: "Student Points (Attendance)",
      sourceKey: `attendance-category-profile-${Math.floor(totalPoints)}`,
      isImportedFromPoints: true,
    });
  }

  return achievements;
}

export function mergeImportedAchievements(existing = [], incoming = []) {
  const merged = [];
  const seen = new Set();

  [...(Array.isArray(existing) ? existing : []), ...(Array.isArray(incoming) ? incoming : [])]
    .map(normalizeAchievementItem)
    .forEach((achievement) => {
      const dedupeKey =
        safeString(achievement.sourceKey).toLowerCase() ||
        `${safeString(achievement.title).toLowerCase()}|${safeString(
          achievement.source,
        ).toLowerCase()}`;

      if (!dedupeKey || seen.has(dedupeKey)) {
        return;
      }

      seen.add(dedupeKey);
      merged.push(achievement);
    });

  return merged;
}
