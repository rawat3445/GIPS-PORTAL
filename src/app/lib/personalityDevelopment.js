function safeString(value) {
  return String(value || "").trim();
}

function uniqueStringArray(values) {
  const seen = new Set();

  return (Array.isArray(values) ? values : [])
    .map((value) => safeString(value))
    .filter((value) => {
      if (!value) return false;
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function createItemId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export const PERSONALITY_POINT_MAX = 10;

export const PERSONALITY_CATEGORY_OPTIONS = [
  { key: "communication", label: "Communication" },
  { key: "interview", label: "Interview" },
  { key: "confidence", label: "Confidence" },
  { key: "leadership", label: "Leadership" },
  { key: "professionalism", label: "Professionalism" },
  { key: "presentation", label: "Presentation" },
  { key: "career", label: "Career Readiness" },
];

export const PERSONALITY_ACTIVITY_OPTIONS = [
  { key: "workshop", label: "Workshop" },
  { key: "seminar", label: "Seminar" },
  { key: "volunteering", label: "Volunteering" },
  { key: "club", label: "Club" },
  { key: "presentation", label: "Presentation" },
  { key: "mock-interview", label: "Mock Interview" },
  { key: "speaking-practice", label: "Speaking Practice" },
  { key: "group-discussion", label: "Group Discussion" },
  { key: "career", label: "Career Activity" },
];

export const PERSONALITY_PRACTICE_MODES = [
  { key: "self-introduction", label: "Self Introduction" },
  { key: "hr-interview", label: "HR Interview" },
  { key: "group-discussion", label: "Group Discussion" },
];

export const PERSONALITY_VOICE_OPTIONS = [
  { key: "Eve", label: "Eve" },
  { key: "Ara", label: "Ara" },
  { key: "Rex", label: "Rex" },
  { key: "Sal", label: "Sal" },
  { key: "Leo", label: "Leo" },
];

export const PERSONALITY_REFLECTION_PROMPTS = [
  "What part of your communication felt stronger this week?",
  "Which situation made you feel less confident, and why?",
  "What is one professional habit you want to improve next week?",
  "What did you learn from your latest workshop, seminar, or practice round?",
];

export function createPersonalityProfileDraft(student = {}) {
  const firstName = safeString(student?.name).split(" ")[0] || "Student";

  return {
    weeklyFocus: "Clear communication and professional confidence",
    careerGoal: "",
    selfIntroduction: `Hello, I am ${firstName}. I am a student at GIPS and I am working on improving my communication, confidence, and interview readiness.`,
    strengths: ["Willing to learn", "Regular student"],
    growthAreas: ["Public speaking", "Interview confidence"],
    weeklyGoals: [
      {
        id: createItemId("goal"),
        title: "Practice one confident self-introduction",
        category: "communication",
        status: "active",
      },
      {
        id: createItemId("goal"),
        title: "Complete one mock interview response",
        category: "interview",
        status: "active",
      },
      {
        id: createItemId("goal"),
        title: "Write one short reflection about growth",
        category: "confidence",
        status: "planned",
      },
    ],
    activities: [],
    reflections: [],
    practiceSessions: [],
    voiceSessions: [],
  };
}

function normalizeGoal(item = {}) {
  const category = safeString(item.category).toLowerCase();
  const status = safeString(item.status).toLowerCase();

  return {
    id: safeString(item.id) || createItemId("goal"),
    title: safeString(item.title),
    category: PERSONALITY_CATEGORY_OPTIONS.find(
      (option) => option.key === category,
    )?.key || "communication",
    status: ["planned", "active", "done"].includes(status) ? status : "active",
  };
}

function normalizeActivity(item = {}) {
  const category = safeString(item.category).toLowerCase();

  return {
    id: safeString(item.id) || createItemId("activity"),
    title: safeString(item.title),
    category: PERSONALITY_ACTIVITY_OPTIONS.find(
      (option) => option.key === category,
    )?.key || "career",
    date: safeString(item.date),
    proofUrl: safeString(item.proofUrl),
    note: safeString(item.note).slice(0, 400),
  };
}

function normalizeReflection(item = {}) {
  return {
    id: safeString(item.id) || createItemId("reflection"),
    prompt: safeString(item.prompt),
    response: safeString(item.response),
    createdAtLabel: safeString(item.createdAtLabel),
  };
}

function normalizePracticeSession(item = {}) {
  const mode = safeString(item.mode).toLowerCase();

  return {
    id: safeString(item.id) || createItemId("practice"),
    mode: PERSONALITY_PRACTICE_MODES.find((option) => option.key === mode)?.key ||
      "hr-interview",
    prompt: safeString(item.prompt),
    answer: safeString(item.answer),
    score: Math.max(0, Math.min(10, Math.round(Number(item.score) || 0))),
    strengths: uniqueStringArray(item.strengths),
    suggestions: uniqueStringArray(item.suggestions),
    improvedAnswer: safeString(item.improvedAnswer),
    createdAtLabel: safeString(item.createdAtLabel),
  };
}

function normalizeVoiceTranscriptTurn(item = {}) {
  const speaker = safeString(item.speaker).toLowerCase();

  return {
    speaker: speaker === "coach" ? "coach" : "student",
    text: safeString(item.text).slice(0, 800),
  };
}

function normalizeVoiceSession(item = {}) {
  const mode = safeString(item.mode).toLowerCase();
  const voice = safeString(item.voice);
  const transcript = (Array.isArray(item.transcript) ? item.transcript : [])
    .map(normalizeVoiceTranscriptTurn)
    .filter((turn) => turn.text)
    .slice(-18);

  return {
    id: safeString(item.id) || createItemId("voice"),
    mode:
      PERSONALITY_PRACTICE_MODES.find((option) => option.key === mode)?.key ||
      "hr-interview",
    topic: safeString(item.topic).slice(0, 220),
    voice:
      PERSONALITY_VOICE_OPTIONS.find((option) => option.key === voice)?.key ||
      "Eve",
    durationSeconds: Math.max(
      0,
      Math.min(60 * 30, Math.round(Number(item.durationSeconds) || 0)),
    ),
    studentTurnCount: Math.max(
      0,
      Math.min(100, Math.round(Number(item.studentTurnCount) || 0)),
    ),
    coachTurnCount: Math.max(
      0,
      Math.min(100, Math.round(Number(item.coachTurnCount) || 0)),
    ),
    transcriptPreview:
      safeString(item.transcriptPreview).slice(0, 400) ||
      transcript
        .map((turn) => `${turn.speaker === "coach" ? "Coach" : "Student"}: ${turn.text}`)
        .join(" ")
        .slice(0, 400),
    transcript,
    createdAtLabel: safeString(item.createdAtLabel),
  };
}

export function normalizePersonalityProfilePayload(payload = {}, student = {}) {
  const source =
    payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const fallback = createPersonalityProfileDraft(student);

  return {
    weeklyFocus: safeString(source.weeklyFocus) || fallback.weeklyFocus,
    careerGoal: safeString(source.careerGoal),
    selfIntroduction:
      safeString(source.selfIntroduction) || fallback.selfIntroduction,
    strengths: uniqueStringArray(source.strengths),
    growthAreas: uniqueStringArray(source.growthAreas),
    weeklyGoals: (Array.isArray(source.weeklyGoals) ? source.weeklyGoals : [])
      .map(normalizeGoal)
      .filter((item) => item.title),
    activities: (Array.isArray(source.activities) ? source.activities : [])
      .map(normalizeActivity)
      .filter((item) => item.title),
    reflections: (Array.isArray(source.reflections) ? source.reflections : [])
      .map(normalizeReflection)
      .filter((item) => item.response),
    practiceSessions: (
      Array.isArray(source.practiceSessions) ? source.practiceSessions : []
    )
      .map(normalizePracticeSession)
      .filter((item) => item.answer),
    voiceSessions: (Array.isArray(source.voiceSessions) ? source.voiceSessions : [])
      .map(normalizeVoiceSession)
      .filter((item) => item.transcript.length || item.transcriptPreview),
  };
}

export function buildPersonalityScore(profile = {}) {
  const strengthsCount = uniqueStringArray(profile.strengths).length;
  const growthAreasCount = uniqueStringArray(profile.growthAreas).length;
  const goals = Array.isArray(profile.weeklyGoals) ? profile.weeklyGoals : [];
  const activities = Array.isArray(profile.activities) ? profile.activities : [];
  const reflections = Array.isArray(profile.reflections) ? profile.reflections : [];
  const practiceSessions = Array.isArray(profile.practiceSessions)
    ? profile.practiceSessions
    : [];
  const voiceSessions = Array.isArray(profile.voiceSessions)
    ? profile.voiceSessions
    : [];
  const totalPracticeCount = practiceSessions.length + voiceSessions.length;
  const doneGoals = goals.filter((goal) => goal.status === "done").length;
  const activeGoals = goals.filter(
    (goal) => goal.status === "active" || goal.status === "done",
  ).length;
  const averagePracticeScore = practiceSessions.length
    ? practiceSessions.reduce(
        (sum, session) => sum + Number(session.score || 0),
        0,
      ) / practiceSessions.length
    : 0;

  const profileCompletionPoints =
    profile.weeklyFocus &&
    profile.selfIntroduction &&
    strengthsCount >= 2 &&
    growthAreasCount >= 2
      ? 2
      : profile.weeklyFocus || profile.selfIntroduction || strengthsCount
        ? 1
        : 0;
  const goalPoints = Math.min(2, doneGoals > 0 ? 1 + Math.min(1, doneGoals - 1) : activeGoals >= 2 ? 1 : 0);
  const activityPoints = Math.min(3, activities.length);
  const reflectionPoints = reflections.length ? 1 : 0;
  const practicePoints = Math.min(
    2,
    totalPracticeCount
      ? 1 + (averagePracticeScore >= 7 || voiceSessions.length >= 2 ? 1 : 0)
      : 0,
  );

  const totalPoints = Math.min(
    PERSONALITY_POINT_MAX,
    profileCompletionPoints +
      goalPoints +
      activityPoints +
      reflectionPoints +
      practicePoints,
  );

  return {
    profileCompletionPoints,
    goalPoints,
    activityPoints,
    reflectionPoints,
    practicePoints,
    totalPoints,
    maxPoints: PERSONALITY_POINT_MAX,
    averagePracticeScore: Number(averagePracticeScore.toFixed(1)),
    completedGoals: doneGoals,
    activeGoals,
    activitiesCount: activities.length,
    reflectionsCount: reflections.length,
    practiceSessionsCount: totalPracticeCount,
    textPracticeSessionsCount: practiceSessions.length,
    voiceSessionsCount: voiceSessions.length,
  };
}

function titleCaseMode(mode) {
  if (mode === "self-introduction") return "self-introduction";
  if (mode === "group-discussion") return "group discussion";
  return "HR interview";
}

export function evaluatePracticeAnswer({ mode, answer, studentName }) {
  const cleanedAnswer = safeString(answer);
  const wordCount = cleanedAnswer ? cleanedAnswer.split(/\s+/).length : 0;
  const lower = cleanedAnswer.toLowerCase();
  const hasGreeting = /(hello|hi|good morning|good afternoon|good evening)/.test(
    lower,
  );
  const hasStructure = /(first|second|finally|because|therefore|for example)/.test(
    lower,
  );
  const hasConfidenceWords = /(i can|i have|i am|i enjoy|i learned|i improved)/.test(
    lower,
  );
  const hasProfessionalWords = /(team|patient|project|responsibility|communication|professional)/.test(
    lower,
  );

  let score = 3;
  if (wordCount >= 35) score += 2;
  if (wordCount >= 70) score += 1;
  if (hasGreeting) score += 1;
  if (hasStructure) score += 1;
  if (hasConfidenceWords) score += 1;
  if (hasProfessionalWords) score += 1;

  score = Math.max(1, Math.min(10, score));

  const strengths = [];
  const suggestions = [];

  if (wordCount >= 35) {
    strengths.push("You gave a fuller answer instead of a one-line response.");
  } else {
    suggestions.push("Add a little more detail so your answer feels complete.");
  }

  if (hasStructure) {
    strengths.push("Your answer shows some structure, which improves clarity.");
  } else {
    suggestions.push(
      "Use a simple structure: who you are, what you do, and why it matters.",
    );
  }

  if (hasConfidenceWords) {
    strengths.push("Your wording sounds more confident and ownership-driven.");
  } else {
    suggestions.push(
      "Use stronger language like 'I learned', 'I handled', or 'I improved'.",
    );
  }

  if (hasProfessionalWords) {
    strengths.push("You connected your answer to professional skills.");
  } else {
    suggestions.push(
      "Mention professional qualities such as communication, teamwork, or responsibility.",
    );
  }

  if (!strengths.length) {
    strengths.push("You made a solid start by attempting the response.");
  }

  if (!suggestions.length) {
    suggestions.push("Practice once more with a slightly shorter and sharper version.");
  }

  const introName = safeString(studentName) || "I";
  const improvedAnswer =
    mode === "group-discussion"
      ? `In my view, this topic is important because it affects students in both practical and personal ways. I would begin by explaining the main issue clearly, then add one or two real examples, and finally suggest a balanced conclusion. This approach helps me speak with more clarity, confidence, and professionalism during a group discussion.`
      : `Hello, I am ${introName}. I am a student who is actively building stronger communication, confidence, and professional skills. Through regular academic work, practice sessions, and personal improvement, I have learned the value of discipline, teamwork, and clear expression. I am now focused on presenting myself more confidently and preparing for interviews and career opportunities.`;

  return {
    score,
    strengths,
    suggestions,
    improvedAnswer,
    coachMessage: `This ${titleCaseMode(mode)} response shows promise. With better structure and confident wording, it can sound much more professional.`,
  };
}

function average(values = []) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function buildPerformanceEvaluation(profile = {}, score = {}) {
  const voiceSessions = Array.isArray(profile.voiceSessions) ? profile.voiceSessions : [];
  const textSessions = Array.isArray(profile.practiceSessions)
    ? profile.practiceSessions
    : [];
  const reflections = Array.isArray(profile.reflections) ? profile.reflections : [];
  const activities = Array.isArray(profile.activities) ? profile.activities : [];
  const goals = Array.isArray(profile.weeklyGoals) ? profile.weeklyGoals : [];

  const recentVoiceSessions = voiceSessions.slice(-4);
  const recentTextSessions = textSessions.slice(-4);
  const recentVoiceMinutes = average(
    recentVoiceSessions.map((item) => Number(item.durationSeconds || 0) / 60),
  );
  const recentTextScore = average(
    recentTextSessions.map((item) => Number(item.score || 0)),
  );
  const recentStudentTurns = average(
    recentVoiceSessions.map((item) => Number(item.studentTurnCount || 0)),
  );
  const doneGoals = goals.filter((goal) => goal.status === "done").length;
  const activeGoals = goals.filter((goal) => goal.status === "active").length;

  let performanceScore = 0;
  performanceScore += Math.min(30, voiceSessions.length * 8);
  performanceScore += Math.min(25, textSessions.length * 6);
  performanceScore += Math.min(15, activities.length * 4);
  performanceScore += Math.min(10, reflections.length * 5);
  performanceScore += Math.min(20, doneGoals * 8 + activeGoals * 3);

  if (recentTextSessions.length) {
    performanceScore += Math.min(12, Math.max(0, recentTextScore - 5) * 2);
  }

  if (recentVoiceSessions.length) {
    performanceScore += Math.min(10, recentStudentTurns);
  }

  const cappedScore = Math.max(0, Math.min(100, Math.round(performanceScore)));
  const band =
    cappedScore >= 80
      ? "Strong momentum"
      : cappedScore >= 60
        ? "Steady progress"
        : cappedScore >= 35
          ? "Developing"
          : "Early stage";

  const strengths = [];
  const concerns = [];

  if (voiceSessions.length >= 2) {
    strengths.push(
      `The student is consistently using live voice practice with ${voiceSessions.length} saved session${voiceSessions.length === 1 ? "" : "s"}.`,
    );
  } else {
    concerns.push("Live voice practice is still limited, so spoken confidence data is light.");
  }

  if (recentTextSessions.length) {
    strengths.push(
      `Recent text-practice score is ${recentTextScore.toFixed(1)}/10, based on real reviewed answers.`,
    );
  } else {
    concerns.push("There are no recent typed practice reviews to measure answer quality yet.");
  }

  if (activities.length >= 2) {
    strengths.push(
      `The profile includes ${activities.length} development activit${activities.length === 1 ? "y" : "ies"}, which shows effort beyond practice prompts.`,
    );
  }

  if (!reflections.length) {
    concerns.push("Reflection entries are missing, so self-awareness progress is harder to evaluate.");
  }

  if (!doneGoals) {
    concerns.push("Goals are present, but completed goal evidence is still limited.");
  }

  let headline = "Performance is being built from real student activity.";
  if (cappedScore >= 80) {
    headline =
      "Performance looks strong because the student is practicing regularly across voice, text, and profile activity.";
  } else if (cappedScore >= 60) {
    headline =
      "Performance looks genuine and improving, with recent evidence from multiple personality-development actions.";
  } else if (cappedScore >= 35) {
    headline =
      "Performance shows real effort, but the student still needs more consistent practice data for a stronger evaluation.";
  } else {
    headline =
      "Performance is still at an early stage because there is not enough recent activity yet.";
  }

  let recommendation = "Complete one more practice round this week.";
  if (recentVoiceSessions.length < 2) {
    recommendation =
      "Add more live voice sessions so speaking confidence can be measured from real conversation behaviour.";
  } else if (recentTextScore && recentTextScore < 7) {
    recommendation =
      "Focus on text practice quality next by improving structure, clarity, and professional wording in reviewed answers.";
  } else if (!reflections.length) {
    recommendation =
      "Add a reflection after each practice block so the coach can measure learning, not just participation.";
  } else if (doneGoals < 2) {
    recommendation =
      "Convert active goals into completed goals to show stronger follow-through in the dashboard.";
  }

  return {
    score: cappedScore,
    band,
    headline,
    recommendation,
    metrics: {
      recentVoiceMinutes: Number(recentVoiceMinutes.toFixed(1)),
      recentTextScore: Number(recentTextScore.toFixed(1)),
      recentStudentTurns: Number(recentStudentTurns.toFixed(1)),
      totalVoiceSessions: voiceSessions.length,
      totalTextSessions: textSessions.length,
      totalActivities: activities.length,
      totalReflections: reflections.length,
      completedGoals: doneGoals,
    },
    strengths: strengths.slice(0, 3),
    concerns: concerns.slice(0, 3),
  };
}

export function buildPersonalitySummary(profile = {}, student = {}) {
  const normalized = normalizePersonalityProfilePayload(profile || {}, student);
  const score = buildPersonalityScore(normalized);
  const performance = buildPerformanceEvaluation(normalized, score);
  const recentPractice = normalized.practiceSessions.slice(-3).reverse();
  const recentVoiceSessions = normalized.voiceSessions.slice(-3).reverse();
  const recentReflections = normalized.reflections.slice(-3).reverse();
  const recentActivities = normalized.activities.slice(-4).reverse();
  const nextStep =
    normalized.weeklyGoals.find((goal) => goal.status !== "done")?.title ||
    "Add one more personality development goal for this week.";

  return {
    profile: normalized,
    score,
    performance,
    nextStep,
    recentPractice,
    recentVoiceSessions,
    recentReflections,
    recentActivities,
  };
}

export function buildAchievementsFromPersonalitySummary(summary = {}) {
  const profile = summary?.profile || {};
  const score = summary?.score || buildPersonalityScore(profile);
  const achievements = [];
  const practiceCount = Number(score.practiceSessionsCount || 0);
  const activityCount = Number(score.activitiesCount || 0);
  const doneGoals = Number(score.completedGoals || 0);

  if (practiceCount >= 1) {
    achievements.push({
      id: createItemId("achievement"),
      title: "Completed personality development practice sessions",
      description:
        "Used portal-based speaking or interview practice to improve communication confidence.",
      source: "Personality Development",
      sourceKey: `pd-practice-${practiceCount}`,
      isImportedFromPoints: true,
    });
  }

  if (activityCount >= 2) {
    achievements.push({
      id: createItemId("achievement"),
      title: "Participated in growth-focused activities",
      description:
        `Recorded ${activityCount} workshops, seminars, presentations, or career-growth activities inside the portal.`,
      source: "Personality Development",
      sourceKey: `pd-activities-${activityCount}`,
      isImportedFromPoints: true,
    });
  }

  if (doneGoals >= 2) {
    achievements.push({
      id: createItemId("achievement"),
      title: "Completed personality development goals",
      description:
        `Finished ${doneGoals} self-development goals related to communication, confidence, or professionalism.`,
      source: "Personality Development",
      sourceKey: `pd-goals-${doneGoals}`,
      isImportedFromPoints: true,
    });
  }

  if (Number(score.totalPoints || 0) >= 7) {
    achievements.push({
      id: createItemId("achievement"),
      title: "Built a strong personality development profile",
      description:
        `Reached ${score.totalPoints}/${score.maxPoints} personality-development points through profile completion, practice, activities, and reflections.`,
      source: "Personality Development",
      sourceKey: `pd-profile-${score.totalPoints}`,
      isImportedFromPoints: true,
    });
  }

  return achievements;
}
