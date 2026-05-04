"use client";

import { GoogleGenAI, Modality } from "@google/genai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  LoaderCircle,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Plus,
  Radio,
  Save,
  Sparkles,
  Trash2,
  Volume2,
} from "lucide-react";
import {
  PERSONALITY_ACTIVITY_OPTIONS,
  PERSONALITY_CATEGORY_OPTIONS,
  PERSONALITY_PRACTICE_MODES,
  PERSONALITY_REFLECTION_PROMPTS,
  PERSONALITY_VOICE_OPTIONS,
} from "../../../lib/personalityDevelopment";

const INPUT_AUDIO_SAMPLE_RATE = 16000;
const OUTPUT_AUDIO_SAMPLE_RATE = 24000;
const GEMINI_VOICE_MAP = {
  Eve: "Puck",
  Ara: "Aoede",
  Rex: "Charon",
  Sal: "Kore",
  Leo: "Fenrir",
};
const PERSONALITY_DEVELOPMENT_ENABLED = false;

const EMPTY_PROFILE = {
  weeklyFocus: "",
  careerGoal: "",
  selfIntroduction: "",
  strengths: [],
  growthAreas: [],
  weeklyGoals: [],
  activities: [],
  practiceSessions: [],
  reflections: [],
  voiceSessions: [],
};

const EMPTY_SUMMARY = {
  score: {
    totalPoints: 0,
    maxPoints: 10,
    completedGoals: 0,
    activitiesCount: 0,
    reflectionsCount: 0,
    practiceSessionsCount: 0,
    textPracticeSessionsCount: 0,
    voiceSessionsCount: 0,
  },
  performance: {
    score: 0,
    band: "Early stage",
    headline: "Performance is still at an early stage because there is not enough recent activity yet.",
    recommendation: "Complete one more practice round this week.",
    metrics: {
      recentVoiceMinutes: 0,
      recentTextScore: 0,
      recentStudentTurns: 0,
      totalVoiceSessions: 0,
      totalTextSessions: 0,
      totalActivities: 0,
      totalReflections: 0,
      completedGoals: 0,
    },
    strengths: [],
    concerns: [],
  },
  nextStep: "Start one practice round to build momentum.",
  recentPractice: [],
  recentVoiceSessions: [],
  recentReflections: [],
  recentActivities: [],
};

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function toCsv(values) {
  return Array.isArray(values) ? values.join(", ") : "";
}

function fromCsv(value) {
  const seen = new Set();
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) return false;
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function formatModeLabel(value) {
  return (
    PERSONALITY_PRACTICE_MODES.find((item) => item.key === value)?.label ||
    "Practice"
  );
}

function formatStatusLabel(status) {
  if (status === "connecting") return "Connecting";
  if (status === "listening") return "Listening";
  if (status === "thinking") return "Thinking";
  if (status === "coach-speaking") return "Coach speaking";
  if (status === "live") return "Live";
  return "Offline";
}

function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function mapPortalVoiceToGeminiVoice(value) {
  return GEMINI_VOICE_MAP[String(value || "").trim()] || "Puck";
}

function bytesToBase64(bytes) {
  let binary = "";
  const size = 0x8000;
  for (let i = 0; i < bytes.length; i += size) {
    binary += String.fromCharCode(...bytes.subarray(i, i + size));
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const text = atob(base64);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) {
    bytes[i] = text.charCodeAt(i);
  }
  return bytes;
}

function float32ToPcmBase64(float32Array) {
  const pcm = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, float32Array[i] || 0));
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return bytesToBase64(new Uint8Array(pcm.buffer));
}

function pcmBase64ToFloat32(base64) {
  const bytes = base64ToBytes(base64);
  const count = Math.floor(bytes.length / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const output = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    output[i] = view.getInt16(i * 2, true) / 32768;
  }
  return output;
}

function resampleFloat32(input, fromRate, toRate) {
  if (!input?.length || fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const length = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const pos = i * ratio;
    const left = Math.floor(pos);
    const right = Math.min(left + 1, input.length - 1);
    const mix = pos - left;
    output[i] = (input[left] || 0) * (1 - mix) + (input[right] || 0) * mix;
  }
  return output;
}

function sanitizeVoiceTranscript(transcript) {
  return (Array.isArray(transcript) ? transcript : [])
    .map((turn) => ({
      speaker:
        String(turn?.speaker || "").toLowerCase() === "coach"
          ? "coach"
          : "student",
      text: String(turn?.text || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 800),
    }))
    .filter((turn) => turn.text)
    .slice(-18);
}

function createGoal() {
  return {
    id: `goal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    category: PERSONALITY_CATEGORY_OPTIONS[0]?.key || "communication",
    status: "planned",
  };
}

function createActivity() {
  return {
    id: `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    category: PERSONALITY_ACTIVITY_OPTIONS[0]?.key || "workshop",
    date: "",
    proofUrl: "",
    note: "",
  };
}

function buildLiveInstructions(profile, mode, topic, student = {}) {
  const parts = [
    "You are the GIPS personality development coach.",
    student?.name ? `Student name: ${student.name}.` : "",
    student?.course ? `Course: ${student.course}.` : "",
    student?.year ? `Year: ${student.year}.` : "",
    `Mode: ${formatModeLabel(mode)}.`,
    topic ? `Topic: ${topic}.` : "",
    profile?.weeklyFocus ? `Weekly focus: ${profile.weeklyFocus}.` : "",
    profile?.careerGoal ? `Career goal: ${profile.careerGoal}.` : "",
    profile?.selfIntroduction
      ? `Student intro draft: ${profile.selfIntroduction}.`
      : "",
    Array.isArray(profile?.strengths) && profile.strengths.length
      ? `Strengths: ${profile.strengths.slice(0, 4).join(", ")}.`
      : "",
    Array.isArray(profile?.growthAreas) && profile.growthAreas.length
      ? `Growth areas: ${profile.growthAreas.slice(0, 4).join(", ")}.`
      : "",
    "Use the student's academic background and profile details to make the coaching more relevant, but keep the tone natural and encouraging.",
    "Speak clearly, ask one question at a time, and keep replies short and natural.",
    "Coach the student on confidence, structure, clarity, and professionalism.",
  ];
  return parts.filter(Boolean).join(" ");
}

function buildLiveKickoff(mode, topic) {
  return topic
    ? `Start a ${formatModeLabel(mode).toLowerCase()} live conversation. Focus on ${topic}. Greet the student and ask the first question now.`
    : `Start a ${formatModeLabel(mode).toLowerCase()} live conversation. Greet the student and ask the first question now.`;
}

function Input(props) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 placeholder:text-slate-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100",
        props.className,
      )}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 placeholder:text-slate-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100",
        props.className,
      )}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100",
        props.className,
      )}
    />
  );
}

function Card({ className, children }) {
  return (
    <section className={cn("rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm", className)}>
      {children}
    </section>
  );
}

function GhostButton(props) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60",
        props.className,
      )}
    />
  );
}

function TabButton({ active, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
        active
          ? "border-teal-600 bg-teal-600 text-white shadow-sm"
          : "border-slate-300 bg-white text-slate-800 hover:border-teal-300 hover:bg-teal-50",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

function applySummary(data) {
  return {
    score: data?.score || EMPTY_SUMMARY.score,
    performance: data?.performance || EMPTY_SUMMARY.performance,
    nextStep: data?.nextStep || EMPTY_SUMMARY.nextStep,
    recentPractice: Array.isArray(data?.recentPractice) ? data.recentPractice : [],
    recentVoiceSessions: Array.isArray(data?.recentVoiceSessions)
      ? data.recentVoiceSessions
      : [],
    recentReflections: Array.isArray(data?.recentReflections)
      ? data.recentReflections
      : [],
    recentActivities: Array.isArray(data?.recentActivities)
      ? data.recentActivities
      : [],
  };
}

export default function StudentPersonalityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [strengthsCsv, setStrengthsCsv] = useState("");
  const [growthAreasCsv, setGrowthAreasCsv] = useState("");

  const [practiceMode, setPracticeMode] = useState(
    PERSONALITY_PRACTICE_MODES[1]?.key || "hr-interview",
  );
  const [practicePrompt, setPracticePrompt] = useState(
    "Tell me about yourself and explain why you would be a good fit for this role.",
  );
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceResult, setPracticeResult] = useState(null);

  const [reflectionPrompt, setReflectionPrompt] = useState(
    PERSONALITY_REFLECTION_PROMPTS[0] || "",
  );
  const [reflectionResponse, setReflectionResponse] = useState("");
  const [reflectionLoading, setReflectionLoading] = useState(false);

  const [liveTopic, setLiveTopic] = useState("");
  const [liveVoice, setLiveVoice] = useState(
    PERSONALITY_VOICE_OPTIONS[0]?.key || "Eve",
  );
  const [liveStatus, setLiveStatus] = useState("disconnected");
  const [liveTranscript, setLiveTranscript] = useState([]);
  const [assistantDraft, setAssistantDraft] = useState("");
  const [liveMicEnabled, setLiveMicEnabled] = useState(true);
  const [liveSessionSeconds, setLiveSessionSeconds] = useState(0);
  const [liveError, setLiveError] = useState("");
  const [savingVoiceSession, setSavingVoiceSession] = useState(false);

  const sessionRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const processorNodeRef = useRef(null);
  const monitorGainRef = useRef(null);
  const playbackSourcesRef = useRef([]);
  const nextPlaybackTimeRef = useRef(0);
  const timerRef = useRef(null);
  const transcriptRef = useRef([]);
  const assistantDraftRef = useRef("");
  const studentDraftRef = useRef("");
  const liveMicEnabledRef = useRef(true);
  const liveStudentRef = useRef(null);
  const liveSessionSavedRef = useRef(false);
  const liveSessionSaveInFlightRef = useRef(false);
  const liveSessionMetaRef = useRef({
    mode: PERSONALITY_PRACTICE_MODES[1]?.key || "hr-interview",
    topic: "",
    voice: PERSONALITY_VOICE_OPTIONS[0]?.key || "Eve",
  });
  const liveSessionSecondsRef = useRef(0);
  const manualCloseRef = useRef(false);
  const sessionStartRef = useRef(0);

  useEffect(() => {
    if (!PERSONALITY_DEVELOPMENT_ENABLED) {
      router.replace("/dashboard/student");
    }
  }, [router]);

  if (!PERSONALITY_DEVELOPMENT_ENABLED) {
    return null;
  }

  const score = summary.score || EMPTY_SUMMARY.score;
  const performance = summary.performance || EMPTY_SUMMARY.performance;
  const overviewStats = useMemo(() => {
    const voiceSessions = Array.isArray(summary.recentVoiceSessions)
      ? summary.recentVoiceSessions
      : [];
    const practiceSessions = Array.isArray(summary.recentPractice)
      ? summary.recentPractice
      : [];
    const averageTextScore = practiceSessions.length
      ? (
          practiceSessions.reduce(
            (sum, item) => sum + Number(item?.score || 0),
            0,
          ) / practiceSessions.length
        ).toFixed(1)
      : "0.0";
    const averageVoiceMinutes = voiceSessions.length
      ? Math.round(
          voiceSessions.reduce(
            (sum, item) => sum + Number(item?.durationSeconds || 0),
            0,
          ) /
            voiceSessions.length /
            60,
        )
      : 0;

    return {
      totalSessions:
        Number(score.practiceSessionsCount || 0) +
        Number(score.voiceSessionsCount || 0),
      averageTextScore,
      averageVoiceMinutes,
      completedGoals: Number(score.completedGoals || 0),
    };
  }, [score, summary.recentPractice, summary.recentVoiceSessions]);
  const finalLiveTranscript = useMemo(() => {
    const pending = String(assistantDraft || "").trim();
    return pending
      ? [...liveTranscript, { speaker: "coach", text: pending }]
      : liveTranscript;
  }, [assistantDraft, liveTranscript]);
  const canSaveLiveSession =
    liveStatus === "disconnected" &&
    sanitizeVoiceTranscript(finalLiveTranscript).length >= 2;
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "live", label: "Live Coach" },
    { key: "text", label: "Text Practice" },
    { key: "profile", label: "Profile" },
    { key: "reflections", label: "Reflections" },
    { key: "history", label: "History" },
  ];

  useEffect(() => {
    liveMicEnabledRef.current = liveMicEnabled;
  }, [liveMicEnabled]);

  useEffect(() => {
    liveSessionSecondsRef.current = liveSessionSeconds;
  }, [liveSessionSeconds]);

  useEffect(() => {
    transcriptRef.current = liveTranscript;
  }, [liveTranscript]);

  useEffect(() => {
    assistantDraftRef.current = assistantDraft;
  }, [assistantDraft]);

  useEffect(() => {
    const promptMap = {
      "self-introduction":
        "Give your self introduction in a confident and professional way.",
      "group-discussion":
        "Share your opinion on the topic with one example and one conclusion.",
      "hr-interview":
        "Tell me about yourself and explain why you would be a good fit for this role.",
    };
    setPracticePrompt(promptMap[practiceMode] || promptMap["hr-interview"]);
  }, [practiceMode]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const response = await fetch("/api/student/personality", {
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            data?.message || "Unable to load personality development.",
          );
        }
        if (cancelled) return;
        setProfile(data?.profile || EMPTY_PROFILE);
        setSummary(applySummary(data));
        setStrengthsCsv(toCsv(data?.profile?.strengths));
        setGrowthAreasCsv(toCsv(data?.profile?.growthAreas));
      } catch (err) {
        if (!cancelled) {
          setError(
            String(err?.message || "Unable to load personality development."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
      disconnectLiveConversation({ silent: true, preserveTranscript: true });
    };
  }, []);

  function applyServerState(data) {
    const nextProfile = data?.profile || EMPTY_PROFILE;
    setProfile(nextProfile);
    setSummary(applySummary(data));
    setStrengthsCsv(toCsv(nextProfile.strengths));
    setGrowthAreasCsv(toCsv(nextProfile.growthAreas));
  }

  function updateProfileField(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateGoal(id, key, value) {
    setProfile((current) => ({
      ...current,
      weeklyGoals: (current.weeklyGoals || []).map((goal) =>
        goal.id === id ? { ...goal, [key]: value } : goal,
      ),
    }));
  }

  function updateActivity(id, key, value) {
    setProfile((current) => ({
      ...current,
      activities: (current.activities || []).map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  }

  async function saveProfile() {
    setSavingProfile(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/student/personality", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            ...profile,
            strengths: fromCsv(strengthsCsv),
            growthAreas: fromCsv(growthAreasCsv),
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Unable to save profile.");
      }
      applyServerState(data);
      setMessage(data?.message || "Personality profile saved.");
    } catch (err) {
      setError(String(err?.message || "Unable to save profile."));
    } finally {
      setSavingProfile(false);
    }
  }

  async function reviewAnswer() {
    setPracticeLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/student/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "practice",
          mode: practiceMode,
          prompt: practicePrompt,
          answer: practiceAnswer,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Unable to review your answer.");
      }
      applyServerState(data);
      setPracticeResult(data?.evaluation || null);
      setPracticeAnswer("");
      setMessage(data?.message || "Practice review completed.");
    } catch (err) {
      setError(String(err?.message || "Unable to review your answer."));
    } finally {
      setPracticeLoading(false);
    }
  }

  async function saveReflection() {
    setReflectionLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/student/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reflection",
          prompt: reflectionPrompt,
          response: reflectionResponse,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Unable to save reflection.");
      }
      applyServerState(data);
      setReflectionResponse("");
      setMessage(data?.message || "Reflection saved.");
    } catch (err) {
      setError(String(err?.message || "Unable to save reflection."));
    } finally {
      setReflectionLoading(false);
    }
  }

  function pushTranscriptTurn(turn) {
    const speaker =
      String(turn?.speaker || "").toLowerCase() === "coach"
        ? "coach"
        : "student";
    const text = String(turn?.text || "").trim();
    if (!text) return;
    setLiveTranscript((current) => {
      const last = current[current.length - 1];
      if (last && last.speaker === speaker && last.text === text) {
        return current;
      }
      return [...current, { speaker, text }].slice(-24);
    });
  }

  function finalizeAssistantDraft() {
    const text = String(assistantDraftRef.current || "").trim();
    if (!text) return;
    setLiveTranscript((current) => {
      const last = current[current.length - 1];
      if (last && last.speaker === "coach" && last.text === text) {
        return current;
      }
      return [...current, { speaker: "coach", text }].slice(-24);
    });
    assistantDraftRef.current = "";
    setAssistantDraft("");
  }

  function appendAssistantDraftChunk(text) {
    const chunk = String(text || "").trim();
    if (!chunk) return;
    assistantDraftRef.current = `${assistantDraftRef.current} ${chunk}`.trim();
    setAssistantDraft(assistantDraftRef.current);
  }

  function finalizeStudentDraft() {
    const text = String(studentDraftRef.current || "").trim();
    if (!text) return;
    pushTranscriptTurn({ speaker: "student", text });
    studentDraftRef.current = "";
  }

  function appendStudentDraftChunk(text, finished = false) {
    const chunk = String(text || "").trim();
    if (!chunk) {
      if (finished) finalizeStudentDraft();
      return;
    }
    studentDraftRef.current = `${studentDraftRef.current} ${chunk}`.trim();
    if (finished) finalizeStudentDraft();
  }

  function stopPlayback() {
    playbackSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {}
      try {
        source.disconnect();
      } catch {}
    });
    playbackSourcesRef.current = [];
    nextPlaybackTimeRef.current = audioContextRef.current?.currentTime || 0;
  }

  function queueAudio(base64Delta) {
    const audioContext = audioContextRef.current;
    if (!audioContext || !base64Delta) return;
    const samples = pcmBase64ToFloat32(base64Delta);
    if (!samples.length) return;
    const buffer = audioContext.createBuffer(
      1,
      samples.length,
      OUTPUT_AUDIO_SAMPLE_RATE,
    );
    buffer.copyToChannel(samples, 0);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    const now = audioContext.currentTime + 0.02;
    const startAt = Math.max(now, nextPlaybackTimeRef.current || now);
    source.start(startAt);
    nextPlaybackTimeRef.current = startAt + buffer.duration;
    playbackSourcesRef.current.push(source);
    source.onended = () => {
      playbackSourcesRef.current = playbackSourcesRef.current.filter(
        (item) => item !== source,
      );
    };
  }

  function getLiveTranscriptSnapshot() {
    const combined = [...(Array.isArray(transcriptRef.current) ? transcriptRef.current : [])];
    const pendingStudent = String(studentDraftRef.current || "").trim();
    const pendingCoach = String(assistantDraftRef.current || "").trim();
    if (pendingStudent) combined.push({ speaker: "student", text: pendingStudent });
    if (pendingCoach) combined.push({ speaker: "coach", text: pendingCoach });
    return sanitizeVoiceTranscript(combined);
  }

  async function persistLiveSession(options = {}) {
    const {
      silent = false,
      clearAfterSave = false,
      transcriptOverride,
      successMessage = "Live voice session saved.",
    } = options;
    const transcript = Array.isArray(transcriptOverride)
      ? sanitizeVoiceTranscript(transcriptOverride)
      : getLiveTranscriptSnapshot();

    if (
      transcript.length < 2 ||
      liveSessionSavedRef.current ||
      liveSessionSaveInFlightRef.current
    ) {
      return { skipped: true };
    }

    liveSessionSaveInFlightRef.current = true;
    setSavingVoiceSession(true);
    if (!silent) {
      setError("");
      setMessage("");
    }

    try {
      const meta = liveSessionMetaRef.current || {};
      const response = await fetch("/api/student/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "voice-session",
          mode: meta.mode || "hr-interview",
          topic: meta.topic || "",
          voice: meta.voice || "Eve",
          durationSeconds: Math.max(
            liveSessionSecondsRef.current || 0,
            Math.round((Date.now() - sessionStartRef.current) / 1000),
          ),
          transcript,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Unable to save live session.");
      }

      liveSessionSavedRef.current = true;
      applyServerState(data);

      if (clearAfterSave) {
        setLiveTranscript([]);
        setAssistantDraft("");
        transcriptRef.current = [];
        assistantDraftRef.current = "";
        studentDraftRef.current = "";
        setLiveTopic("");
        setLiveSessionSeconds(0);
        liveSessionSecondsRef.current = 0;
      }

      setMessage(data?.message || successMessage);
      return { ok: true, data };
    } catch (err) {
      if (!silent) {
        setError(String(err?.message || "Unable to save live session."));
      }
      return { ok: false, error: err };
    } finally {
      liveSessionSaveInFlightRef.current = false;
      setSavingVoiceSession(false);
    }
  }

  async function disconnectLiveConversation(options = {}) {
    const { silent = false, preserveTranscript = true } = options;
    manualCloseRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const transcriptSnapshot = getLiveTranscriptSnapshot();
    if (transcriptSnapshot.length >= 2 && !liveSessionSavedRef.current) {
      await persistLiveSession({
        silent: true,
        transcriptOverride: transcriptSnapshot,
        successMessage: "Live voice session saved automatically.",
      });
    }
    finalizeStudentDraft();
    finalizeAssistantDraft();
    stopPlayback();
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {}
      sessionRef.current = null;
    }
    if (processorNodeRef.current) {
      try {
        processorNodeRef.current.disconnect();
      } catch {}
      processorNodeRef.current.onaudioprocess = null;
      processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    if (monitorGainRef.current) {
      try {
        monitorGainRef.current.disconnect();
      } catch {}
      monitorGainRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    nextPlaybackTimeRef.current = 0;
    setLiveMicEnabled(true);
    setLiveStatus("disconnected");
    if (!preserveTranscript) {
      setLiveTranscript([]);
      setAssistantDraft("");
      transcriptRef.current = [];
      assistantDraftRef.current = "";
      studentDraftRef.current = "";
    }
    if (!silent) setMessage("Live voice conversation ended.");
  }

  async function connectLiveConversation() {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setLiveError("Microphone access is not available in this browser.");
      return;
    }

    setError("");
    setMessage("");
    setLiveError("");
    setLiveTranscript([]);
    setAssistantDraft("");
    transcriptRef.current = [];
    assistantDraftRef.current = "";
    studentDraftRef.current = "";
    liveStudentRef.current = null;
    liveSessionSavedRef.current = false;
    liveSessionSaveInFlightRef.current = false;
    liveSessionMetaRef.current = {
      mode: practiceMode,
      topic: "",
      voice: liveVoice,
    };
    manualCloseRef.current = false;
    sessionStartRef.current = Date.now();
    setLiveSessionSeconds(0);
    liveSessionSecondsRef.current = 0;
    setLiveStatus("connecting");

    try {
      const tokenResponse = await fetch("/api/student/personality/realtime-session", {
        method: "POST",
      });
      const tokenData = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok) {
        throw new Error(tokenData?.message || "Unable to start live conversation.");
      }
      liveStudentRef.current = tokenData?.student || null;
      liveSessionMetaRef.current = {
        mode: practiceMode,
        topic: liveTopic,
        voice: liveVoice,
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("AudioContext is not available in this browser.");
      }
      const audioContext = new AudioContextClass({
        sampleRate: OUTPUT_AUDIO_SAMPLE_RATE,
      });
      if (audioContext.state === "suspended") await audioContext.resume();

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const monitorGain = audioContext.createGain();
      monitorGain.gain.value = 0;
      source.connect(processor);
      processor.connect(monitorGain);
      monitorGain.connect(audioContext.destination);

      mediaStreamRef.current = stream;
      audioContextRef.current = audioContext;
      sourceNodeRef.current = source;
      processorNodeRef.current = processor;
      monitorGainRef.current = monitorGain;
      nextPlaybackTimeRef.current = audioContext.currentTime;

      const ai = new GoogleGenAI({
        apiKey: tokenData.authToken,
        httpOptions: { apiVersion: "v1alpha" },
      });
      const session = await ai.live.connect({
        model: tokenData.model || "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: buildLiveInstructions(
            profile,
            practiceMode,
            liveTopic,
            tokenData?.student,
          ),
          speechConfig: {
            languageCode: "en-IN",
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: mapPortalVoiceToGeminiVoice(liveVoice),
              },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setLiveStatus("live");
          },
          onmessage: (payload) => {
            try {
              if (payload?.serverContent?.interrupted) {
                stopPlayback();
                setLiveStatus("listening");
              }

              if (payload?.serverContent?.inputTranscription?.text) {
                appendStudentDraftChunk(
                  payload.serverContent.inputTranscription.text,
                  payload.serverContent.inputTranscription.finished,
                );
                if (!payload.serverContent.inputTranscription.finished) {
                  setLiveStatus("listening");
                }
              }

              if (payload?.serverContent?.outputTranscription?.text) {
                appendAssistantDraftChunk(payload.serverContent.outputTranscription.text);
                setLiveStatus("coach-speaking");
              }

              if (payload?.data) {
                queueAudio(payload.data);
                setLiveStatus("coach-speaking");
              }

              if (payload?.serverContent?.turnComplete) {
                finalizeStudentDraft();
                finalizeAssistantDraft();
                setLiveStatus("live");
              }
            } catch (err) {
              setLiveError(
                String(
                  err?.message || "Unable to process a live conversation event.",
                ),
              );
            }
          },
          onerror: (event) => {
            setLiveError(
              String(
                event?.error?.message ||
                  "The live voice connection ran into a network error.",
              ),
            );
          },
          onclose: () => {
            if (timerRef.current) clearInterval(timerRef.current);
            stopPlayback();
            sessionRef.current = null;
            if (!manualCloseRef.current) {
              finalizeStudentDraft();
              finalizeAssistantDraft();
              setLiveStatus("disconnected");
              setLiveError(
                "The live voice conversation ended unexpectedly. Your transcript has been kept and the session may already be auto-saved.",
              );
            }
          },
        },
      });
      sessionRef.current = session;

      session.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [{ text: buildLiveKickoff(practiceMode, liveTopic) }],
          },
        ],
        turnComplete: true,
      });

      processor.onaudioprocess = (event) => {
        const liveSession = sessionRef.current;
        if (!liveSession || !liveMicEnabledRef.current) {
          return;
        }
        const channel = event.inputBuffer.getChannelData(0);
        const data =
          audioContext.sampleRate === INPUT_AUDIO_SAMPLE_RATE
            ? new Float32Array(channel)
            : resampleFloat32(
                new Float32Array(channel),
                audioContext.sampleRate,
                INPUT_AUDIO_SAMPLE_RATE,
              );
        liveSession.sendRealtimeInput({
          audio: {
            data: float32ToPcmBase64(data),
            mimeType: `audio/pcm;rate=${INPUT_AUDIO_SAMPLE_RATE}`,
          },
        });
      };

      timerRef.current = setInterval(() => {
        setLiveSessionSeconds(
          Math.max(0, Math.round((Date.now() - sessionStartRef.current) / 1000)),
        );
      }, 1000);
    } catch (err) {
      await disconnectLiveConversation({ silent: true, preserveTranscript: false });
      setLiveStatus("disconnected");
      setLiveError(String(err?.message || "Unable to start live conversation."));
    }
  }

  async function saveLiveSession() {
    await persistLiveSession({ clearAfterSave: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-center rounded-[28px] border border-slate-200 bg-white p-10">
          <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-teal-600" />
          <span className="text-sm font-medium text-slate-700">
            Loading personality development coach...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ecfdf5_100%)] px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,#0f172a,#0f766e)] p-8 text-white shadow-xl">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
                <Radio className="h-4 w-4" />
                Personality Development
              </span>
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
                Practice live AI conversation, strengthen confidence, and build a better student profile.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                This page now combines your profile, live voice coaching, built-in text review, and saved development history in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/student/points" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900">
                  View points guide
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard/student/points/resume" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white">
                  Resume preview
                  <Sparkles className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <Card className="border-white/10 bg-white/10 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">Score</p>
                <p className="mt-3 text-4xl font-semibold">{score.totalPoints}/10</p>
              </Card>
              <Card className="border-white/10 bg-white/10 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">Next step</p>
                <p className="mt-3 text-sm leading-6 text-slate-100">{summary.nextStep}</p>
              </Card>
              <Card className="border-white/10 bg-white/10 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">Saved voice</p>
                <p className="mt-3 text-4xl font-semibold">{score.voiceSessionsCount || 0}</p>
              </Card>
            </div>
          </div>
        </section>

        {(error || liveError || message) && (
          <div className="space-y-3">
            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
            {liveError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{liveError}</div> : null}
            {message ? <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{message}</div> : null}
          </div>
        )}

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <TabButton
                key={tab.key}
                active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>
        </section>

        {activeTab === "overview" ? (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-teal-100 bg-[linear-gradient(180deg,#ffffff,#f0fdfa)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Total practice</p>
                <p className="mt-3 text-4xl font-semibold text-slate-950">{overviewStats.totalSessions}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">Live voice and typed practice sessions together.</p>
              </Card>
              <Card className="border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Text score avg</p>
                <p className="mt-3 text-4xl font-semibold text-slate-950">{overviewStats.averageTextScore}/10</p>
                <p className="mt-2 text-sm font-medium text-slate-700">Based on your latest typed practice reviews.</p>
              </Card>
              <Card className="border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Voice duration</p>
                <p className="mt-3 text-4xl font-semibold text-slate-950">{overviewStats.averageVoiceMinutes} min</p>
                <p className="mt-2 text-sm font-medium text-slate-700">Average length of your recent live voice sessions.</p>
              </Card>
              <Card className="border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Goals done</p>
                <p className="mt-3 text-4xl font-semibold text-slate-950">{overviewStats.completedGoals}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">Completed growth goals tracked in your profile.</p>
              </Card>
            </section>

            <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Performance dashboard</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">See how the student is improving</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">Overall progress</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">{score.totalPoints}/{score.maxPoints}</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">{summary.nextStep}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">Live coach usage</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">{score.voiceSessionsCount || 0}</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">Saved live voice sessions available in MongoDB.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">Text coach usage</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">{score.textPracticeSessionsCount || 0}</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">Typed answers reviewed by the built-in coach.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">Reflections saved</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">{score.reflectionsCount || 0}</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">Weekly growth notes and self-review entries.</p>
                  </div>
                </div>
              </Card>

              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Quick access</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Open one task at a time</h2>
                <div className="mt-5 grid gap-3">
                  <button type="button" onClick={() => setActiveTab("live")} className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-left">
                    <p className="text-sm font-semibold text-slate-900">Live voice conversation</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">Talk with the AI coach in real time and auto-save the transcript.</p>
                  </button>
                  <button type="button" onClick={() => setActiveTab("text")} className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-left">
                    <p className="text-sm font-semibold text-slate-900">Text practice review</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">Write an answer and get structured suggestions instantly.</p>
                  </button>
                  <button type="button" onClick={() => setActiveTab("profile")} className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-left">
                    <p className="text-sm font-semibold text-slate-900">Profile and goals</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">Update student background, goals, and development activities.</p>
                  </button>
                  <button type="button" onClick={() => setActiveTab("history")} className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-left">
                    <p className="text-sm font-semibold text-slate-900">History and saved sessions</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">Review the student’s past voice sessions, reflections, and activity notes.</p>
                  </button>
                </div>
              </Card>
            </section>

            <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-teal-100 bg-[linear-gradient(180deg,#ffffff,#f0fdfa)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">AI evaluation</p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">{performance.band}</h2>
                    <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-800">{performance.headline}</p>
                  </div>
                  <div className="rounded-2xl border border-teal-200 bg-white px-5 py-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Performance score</p>
                    <p className="mt-2 text-4xl font-semibold text-slate-950">{performance.score}/100</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Recent text avg</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{performance.metrics.recentTextScore}/10</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Recent voice mins</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{performance.metrics.recentVoiceMinutes}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Student turns avg</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{performance.metrics.recentStudentTurns}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Completed goals</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{performance.metrics.completedGoals}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-900">Coach recommendation</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-800">{performance.recommendation}</p>
                </div>
              </Card>

              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Evidence summary</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Why this evaluation was given</h2>
                <div className="mt-5 grid gap-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-900">Measured strengths</p>
                    <div className="mt-3 space-y-2">
                      {(performance.strengths || []).length ? (
                        performance.strengths.map((item, index) => (
                          <p key={`strength-${index}`} className="text-sm font-medium leading-6 text-emerald-900">
                            {item}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm font-medium leading-6 text-emerald-900">
                          More data will appear here as the student completes voice, text, and activity work.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">Current gaps</p>
                    <div className="mt-3 space-y-2">
                      {(performance.concerns || []).length ? (
                        performance.concerns.map((item, index) => (
                          <p key={`concern-${index}`} className="text-sm font-medium leading-6 text-amber-900">
                            {item}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm font-medium leading-6 text-amber-900">
                          No major gaps were detected from the recent student activity.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        ) : null}

        {activeTab !== "overview" ? (
          <div className="space-y-8">
            <div className={cn("space-y-8", activeTab !== "profile" && "hidden")}>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Growth profile</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Tell the coach who you are</h2>
                </div>
                <GhostButton onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save profile
                </GhostButton>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Weekly focus</label>
                  <Input value={profile.weeklyFocus || ""} onChange={(e) => updateProfileField("weeklyFocus", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Career goal</label>
                  <Input value={profile.careerGoal || ""} onChange={(e) => updateProfileField("careerGoal", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Self introduction</label>
                  <Textarea rows={4} value={profile.selfIntroduction || ""} onChange={(e) => updateProfileField("selfIntroduction", e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Strengths</label>
                  <Input value={strengthsCsv} onChange={(e) => setStrengthsCsv(e.target.value)} placeholder="team work, punctuality, curiosity" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Growth areas</label>
                  <Input value={growthAreasCsv} onChange={(e) => setGrowthAreasCsv(e.target.value)} placeholder="public speaking, confidence, structure" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Weekly goals</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Track what you want to improve</h2>
                </div>
                <GhostButton onClick={() => setProfile((current) => ({ ...current, weeklyGoals: [...(current.weeklyGoals || []), createGoal()] }))}>
                  <Plus className="h-4 w-4" />
                  Add goal
                </GhostButton>
              </div>
              <div className="mt-5 space-y-3">
                {(profile.weeklyGoals || []).map((goal) => (
                  <div key={goal.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-[1.4fr_0.9fr_0.9fr_auto] sm:items-end">
                      <Input value={goal.title || ""} onChange={(e) => updateGoal(goal.id, "title", e.target.value)} placeholder="Practice one strong introduction" />
                      <Select value={goal.category || "communication"} onChange={(e) => updateGoal(goal.id, "category", e.target.value)}>
                        {PERSONALITY_CATEGORY_OPTIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                      </Select>
                      <Select value={goal.status || "planned"} onChange={(e) => updateGoal(goal.id, "status", e.target.value)}>
                        <option value="planned">Planned</option>
                        <option value="active">Active</option>
                        <option value="done">Done</option>
                      </Select>
                      <GhostButton onClick={() => setProfile((current) => ({ ...current, weeklyGoals: (current.weeklyGoals || []).filter((item) => item.id !== goal.id) }))}>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </GhostButton>
                    </div>
                  </div>
                ))}
                {!profile.weeklyGoals?.length ? <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-medium text-slate-700">Add a goal so the coach can keep your progress focused.</div> : null}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Activities and proof</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Record real development work</h2>
                </div>
                <GhostButton onClick={() => setProfile((current) => ({ ...current, activities: [...(current.activities || []), createActivity()] }))}>
                  <Plus className="h-4 w-4" />
                  Add activity
                </GhostButton>
              </div>
              <div className="mt-5 space-y-3">
                {(profile.activities || []).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input className="sm:col-span-2" value={item.title || ""} onChange={(e) => updateActivity(item.id, "title", e.target.value)} placeholder="Seminar, workshop, mock interview, presentation" />
                      <Select value={item.category || PERSONALITY_ACTIVITY_OPTIONS[0]?.key} onChange={(e) => updateActivity(item.id, "category", e.target.value)}>
                        {PERSONALITY_ACTIVITY_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                      </Select>
                      <Input type="date" value={item.date || ""} onChange={(e) => updateActivity(item.id, "date", e.target.value)} />
                      <Input className="sm:col-span-2" value={item.proofUrl || ""} onChange={(e) => updateActivity(item.id, "proofUrl", e.target.value)} placeholder="Optional proof link" />
                      <Textarea className="sm:col-span-2" rows={3} value={item.note || ""} onChange={(e) => updateActivity(item.id, "note", e.target.value)} placeholder="What did you learn?" />
                      <GhostButton onClick={() => setProfile((current) => ({ ...current, activities: (current.activities || []).filter((entry) => entry.id !== item.id) }))}>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </GhostButton>
                    </div>
                  </div>
                ))}
                {!profile.activities?.length ? <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-medium text-slate-700">Workshops, presentations, volunteering, and speaking practice all belong here.</div> : null}
              </div>
            </Card>
          </div>

          <div className={cn("space-y-8", activeTab === "profile" && "hidden")}>
            <Card className={cn("border-teal-200 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(240,253,250,0.9))]", activeTab !== "live" && "hidden")}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Live AI conversation</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Speak with the coach in real time</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">Your browser streams microphone audio to Gemini Live. The coach uses the student profile, course, year, and saved personality details to make each conversation more relevant.</p>
                </div>
                <div className="rounded-2xl border border-teal-200 bg-white px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Status</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatStatusLabel(liveStatus)}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Select value={practiceMode} onChange={(e) => setPracticeMode(e.target.value)}>
                  {PERSONALITY_PRACTICE_MODES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </Select>
                <Select value={liveVoice} onChange={(e) => setLiveVoice(e.target.value)}>
                  {PERSONALITY_VOICE_OPTIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </Select>
                <Textarea className="md:col-span-2" rows={3} value={liveTopic} onChange={(e) => setLiveTopic(e.target.value)} placeholder="Interview role, self introduction scenario, or discussion topic" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Connection</p><p className="mt-2 text-2xl font-semibold text-slate-950">{formatStatusLabel(liveStatus)}</p></Card>
                <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Session</p><p className="mt-2 text-2xl font-semibold text-slate-950">{formatDuration(liveSessionSeconds)}</p></Card>
                <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Saved voice</p><p className="mt-2 text-2xl font-semibold text-slate-950">{score.voiceSessionsCount || 0}</p></Card>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {liveStatus === "disconnected" ? (
                  <button type="button" onClick={connectLiveConversation} className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white">
                    <PhoneCall className="h-4 w-4" />
                    Start live conversation
                  </button>
                ) : (
                  <button type="button" onClick={() => disconnectLiveConversation({ preserveTranscript: true })} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white">
                    <PhoneOff className="h-4 w-4" />
                    End conversation
                  </button>
                )}
                <GhostButton onClick={() => setLiveMicEnabled((current) => !current)} disabled={liveStatus === "disconnected" || liveStatus === "connecting"}>
                  {liveMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  {liveMicEnabled ? "Mute mic" : "Unmute mic"}
                </GhostButton>
                <GhostButton onClick={saveLiveSession} disabled={!canSaveLiveSession || savingVoiceSession}>
                  {savingVoiceSession ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save session
                </GhostButton>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-700">
                Raw audio is not stored in MongoDB. Transcript text, metadata, turn counts, and a short preview are saved automatically when a usable voice session ends. Each student keeps up to 8 saved sessions and each saved transcript keeps up to 18 turns.
              </div>
              <div className="mt-5 rounded-[26px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Live transcript</p>
                    <p className="text-xs text-slate-700">Conversation appears here while you talk.</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    <Volume2 className="h-3.5 w-3.5" />
                    {liveMicEnabled ? "Mic on" : "Mic muted"}
                  </span>
                </div>
                <div className="mt-4 max-h-[380px] space-y-3 overflow-y-auto">
                  {finalLiveTranscript.length ? finalLiveTranscript.map((turn, index) => (
                    <div key={`${turn.speaker}-${index}`} className={cn("max-w-[90%] rounded-3xl px-4 py-3 text-sm leading-6", turn.speaker === "coach" ? "mr-auto bg-slate-100 text-slate-800" : "ml-auto bg-teal-600 text-white")}>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">{turn.speaker === "coach" ? "Coach" : "Student"}</p>
                      <p>{turn.text}</p>
                    </div>
                  )) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-800">Start a live conversation and your transcript will appear here.</div>}
                </div>
              </div>
            </Card>

            <Card className={cn(activeTab !== "text" && "hidden")}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Built-in coach</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Get an instant review of your typed answer</h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Grok backed
                </span>
              </div>
              <div className="mt-5 space-y-4">
                <Select value={practiceMode} onChange={(e) => setPracticeMode(e.target.value)}>
                  {PERSONALITY_PRACTICE_MODES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </Select>
                <Textarea rows={3} value={practicePrompt} onChange={(e) => setPracticePrompt(e.target.value)} />
                <Textarea rows={6} value={practiceAnswer} onChange={(e) => setPracticeAnswer(e.target.value)} placeholder="Write your answer here" />
                <div className="flex justify-end">
                  <button type="button" onClick={reviewAnswer} disabled={practiceLoading} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {practiceLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Review answer
                  </button>
                </div>
              </div>
              {practiceResult ? (
                <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Latest coach review</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{practiceResult.coachMessage}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Score</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{practiceResult.score}/10</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4"><p className="text-sm font-semibold text-slate-900">Strengths</p><ul className="mt-3 space-y-2 text-sm font-medium text-slate-800">{(practiceResult.strengths || []).map((item, index) => <li key={`s-${index}`}>- {item}</li>)}</ul></div>
                    <div className="rounded-2xl bg-white p-4"><p className="text-sm font-semibold text-slate-900">Suggestions</p><ul className="mt-3 space-y-2 text-sm font-medium text-slate-800">{(practiceResult.suggestions || []).map((item, index) => <li key={`g-${index}`}>- {item}</li>)}</ul></div>
                  </div>
                  {practiceResult.improvedAnswer ? <div className="rounded-2xl bg-white p-4"><p className="text-sm font-semibold text-slate-900">Improved answer example</p><p className="mt-3 text-sm font-medium leading-7 text-slate-800">{practiceResult.improvedAnswer}</p></div> : null}
                </div>
              ) : null}
            </Card>

            <Card className={cn(activeTab !== "reflections" && "hidden")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Reflection journal</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Capture what you learned this week</h2>
              <div className="mt-5 space-y-4">
                <Select value={reflectionPrompt} onChange={(e) => setReflectionPrompt(e.target.value)}>
                  {PERSONALITY_REFLECTION_PROMPTS.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Textarea rows={5} value={reflectionResponse} onChange={(e) => setReflectionResponse(e.target.value)} placeholder="Write what went better and what you want to improve next." />
                <div className="flex justify-end">
                  <button type="button" onClick={saveReflection} disabled={reflectionLoading} className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {reflectionLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save reflection
                  </button>
                </div>
              </div>
            </Card>

            <Card className={cn(activeTab !== "history" && "hidden")}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Recent history</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">See how your profile is growing</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Goals done</p><p className="mt-2 text-2xl font-semibold text-slate-950">{score.completedGoals || 0}</p></Card>
                <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Activities</p><p className="mt-2 text-2xl font-semibold text-slate-950">{score.activitiesCount || 0}</p></Card>
                <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Practice total</p><p className="mt-2 text-2xl font-semibold text-slate-950">{score.practiceSessionsCount || 0}</p></Card>
                <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Voice sessions</p><p className="mt-2 text-2xl font-semibold text-slate-950">{score.voiceSessionsCount || 0}</p></Card>
                <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Text practice</p><p className="mt-2 text-2xl font-semibold text-slate-950">{score.textPracticeSessionsCount || 0}</p></Card>
                <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Reflections</p><p className="mt-2 text-2xl font-semibold text-slate-950">{score.reflectionsCount || 0}</p></Card>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Recent text practice</p>
                    <div className="mt-3 space-y-3">{summary.recentPractice.length ? summary.recentPractice.map((item) => <div key={item.id} className="rounded-2xl bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-900">{formatModeLabel(item.mode)}</p><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.score}/10</span></div><p className="mt-2 text-sm font-medium text-slate-700">{item.createdAtLabel}</p></div>) : <p className="text-sm font-medium text-slate-700">No text practice saved yet.</p>}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Recent reflections</p>
                    <div className="mt-3 space-y-3">{summary.recentReflections.length ? summary.recentReflections.map((item) => <div key={item.id} className="rounded-2xl bg-white p-4"><p className="text-sm font-semibold text-slate-900">{item.prompt}</p><p className="mt-2 text-sm font-medium leading-6 text-slate-800">{item.response}</p></div>) : <p className="text-sm font-medium text-slate-700">No reflections saved yet.</p>}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Recent saved voice sessions</p>
                    <div className="mt-3 space-y-3">{summary.recentVoiceSessions.length ? summary.recentVoiceSessions.map((item) => <div key={item.id} className="rounded-2xl bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-900">{item.topic || formatModeLabel(item.mode)}</p><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">{formatDuration(item.durationSeconds || 0)}</span></div><p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{item.voice} voice</p><p className="mt-3 text-sm font-medium leading-6 text-slate-800">{item.transcriptPreview}</p></div>) : <p className="text-sm font-medium text-slate-700">No live voice sessions saved yet.</p>}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Recent activities</p>
                    <div className="mt-3 space-y-3">{summary.recentActivities.length ? summary.recentActivities.map((item) => <div key={item.id} className="rounded-2xl bg-white p-4"><p className="text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-2 text-sm font-medium text-slate-700">{[item.category, item.date].filter(Boolean).join(" - ")}</p>{item.note ? <p className="mt-2 text-sm font-medium leading-6 text-slate-800">{item.note}</p> : null}</div>) : <p className="text-sm font-medium text-slate-700">No activities recorded yet.</p>}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
        ) : null}
    </div>
    </div>
  );
}
