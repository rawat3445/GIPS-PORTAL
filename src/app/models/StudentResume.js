import mongoose from "mongoose";

const ResumeLineSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const EducationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    institution: { type: String, default: "", trim: true },
    course: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    startYear: { type: String, default: "", trim: true },
    endYear: { type: String, default: "", trim: true },
    score: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const ProjectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    role: { type: String, default: "", trim: true },
    techStack: [{ type: String, trim: true }],
    startDate: { type: String, default: "", trim: true },
    endDate: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    bullets: [{ type: String, trim: true }],
    link: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const InternshipSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    organization: { type: String, default: "", trim: true },
    role: { type: String, default: "", trim: true },
    duration: { type: String, default: "", trim: true },
    startDate: { type: String, default: "", trim: true },
    endDate: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    bullets: [{ type: String, trim: true }],
  },
  { _id: false },
);

const CertificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    issuer: { type: String, default: "", trim: true },
    issuedOn: { type: String, default: "", trim: true },
    link: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const AchievementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    source: { type: String, default: "", trim: true },
    sourceKey: { type: String, default: "", trim: true },
    isImportedFromPoints: { type: Boolean, default: false },
  },
  { _id: false },
);

const StudentResumeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "completed"],
      default: "draft",
      trim: true,
    },
    resumeBuilderUnlockedAt: {
      type: Date,
      default: null,
    },
    templateKey: {
      type: String,
      enum: ["ats-clean", "modern-student"],
      default: "ats-clean",
      trim: true,
    },
    personal: {
      fullName: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      address: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      linkedin: { type: String, default: "", trim: true },
      github: { type: String, default: "", trim: true },
      portfolio: { type: String, default: "", trim: true },
      profileImage: { type: String, default: "", trim: true },
      course: { type: String, default: "", trim: true },
      year: { type: Number, default: null },
    },
    headline: { type: String, default: "", trim: true },
    summary: { type: String, default: "", trim: true },
    education: {
      type: [EducationSchema],
      default: [],
    },
    skills: {
      technicalSkills: [{ type: String, trim: true }],
      softSkills: [{ type: String, trim: true }],
      tools: [{ type: String, trim: true }],
      languages: [{ type: String, trim: true }],
    },
    projects: {
      type: [ProjectSchema],
      default: [],
    },
    internships: {
      type: [InternshipSchema],
      default: [],
    },
    certifications: {
      type: [CertificationSchema],
      default: [],
    },
    achievements: {
      type: [AchievementSchema],
      default: [],
    },
    activities: {
      type: [ResumeLineSchema],
      default: [],
    },
    preferences: {
      accentColor: {
        type: String,
        enum: ["slate", "blue", "emerald", "amber"],
        default: "slate",
        trim: true,
      },
      fontScale: { type: String, default: "md", trim: true },
      sectionOrder: [{ type: String, trim: true }],
      showPhoto: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

const StudentResume =
  mongoose.models.StudentResume ||
  mongoose.model("StudentResume", StudentResumeSchema);

export default StudentResume;
