import mongoose from "mongoose";

const GoalSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: [
        "communication",
        "interview",
        "confidence",
        "leadership",
        "professionalism",
        "presentation",
        "career",
      ],
      default: "communication",
      trim: true,
    },
    status: {
      type: String,
      enum: ["planned", "active", "done"],
      default: "active",
      trim: true,
    },
  },
  { _id: false },
);

const ActivitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: [
        "workshop",
        "seminar",
        "volunteering",
        "club",
        "presentation",
        "mock-interview",
        "speaking-practice",
        "group-discussion",
        "career",
      ],
      default: "career",
      trim: true,
    },
    date: { type: String, default: "", trim: true },
    proofUrl: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const ReflectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    prompt: { type: String, default: "", trim: true },
    response: { type: String, default: "", trim: true },
    createdAtLabel: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const PracticeSessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    mode: {
      type: String,
      enum: ["self-introduction", "hr-interview", "group-discussion"],
      default: "hr-interview",
      trim: true,
    },
    prompt: { type: String, default: "", trim: true },
    answer: { type: String, default: "", trim: true },
    score: { type: Number, default: 0 },
    strengths: [{ type: String, trim: true }],
    suggestions: [{ type: String, trim: true }],
    improvedAnswer: { type: String, default: "", trim: true },
    createdAtLabel: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const VoiceTranscriptTurnSchema = new mongoose.Schema(
  {
    speaker: {
      type: String,
      enum: ["student", "coach"],
      default: "student",
      trim: true,
    },
    text: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const VoiceSessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    mode: {
      type: String,
      enum: ["self-introduction", "hr-interview", "group-discussion"],
      default: "hr-interview",
      trim: true,
    },
    topic: { type: String, default: "", trim: true },
    voice: {
      type: String,
      enum: ["Eve", "Ara", "Rex", "Sal", "Leo"],
      default: "Eve",
      trim: true,
    },
    durationSeconds: { type: Number, default: 0 },
    studentTurnCount: { type: Number, default: 0 },
    coachTurnCount: { type: Number, default: 0 },
    transcriptPreview: { type: String, default: "", trim: true },
    transcript: {
      type: [VoiceTranscriptTurnSchema],
      default: [],
    },
    createdAtLabel: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const StudentPersonalityProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    weeklyFocus: { type: String, default: "", trim: true },
    careerGoal: { type: String, default: "", trim: true },
    selfIntroduction: { type: String, default: "", trim: true },
    strengths: [{ type: String, trim: true }],
    growthAreas: [{ type: String, trim: true }],
    weeklyGoals: {
      type: [GoalSchema],
      default: [],
    },
    activities: {
      type: [ActivitySchema],
      default: [],
    },
    reflections: {
      type: [ReflectionSchema],
      default: [],
    },
    practiceSessions: {
      type: [PracticeSessionSchema],
      default: [],
    },
    voiceSessions: {
      type: [VoiceSessionSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const StudentPersonalityProfile =
  mongoose.models.StudentPersonalityProfile ||
  mongoose.model("StudentPersonalityProfile", StudentPersonalityProfileSchema);

export default StudentPersonalityProfile;
