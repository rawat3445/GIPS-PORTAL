import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["note", "pdf", "link", "video", "doc"],
      default: "note",
      trim: true,
    },
    storageProvider: {
      type: String,
      enum: ["", "r2", "gcs"],
      default: "",
      trim: true,
    },
    resourceUrl: {
      type: String,
      default: "",
      trim: true,
    },
    resourcePublicId: {
      type: String,
      default: "",
      trim: true,
    },
    uploadedFileName: {
      type: String,
      default: "",
      trim: true,
    },
    uploadedMimeType: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

const SubjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    facultyName: {
      type: String,
      default: "",
      trim: true,
    },
    facultyEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    materials: {
      type: [MaterialSchema],
      default: [],
    },
  },
  { _id: true },
);

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
    tag: {
      type: String,
      default: "",
      trim: true,
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true },
);

const CourseCatalogSchema = new mongoose.Schema(
  {
    course: {
      type: String,
      enum: ["BPT", "BOPTOM", "BMRIT", "DOPTOM", "BOTT"],
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
      index: true,
    },
    publishStatus: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    semesterLabel: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    overview: {
      type: String,
      default: "",
      trim: true,
    },
    coordinatorName: {
      type: String,
      default: "",
      trim: true,
    },
    coordinatorEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    supportNote: {
      type: String,
      default: "",
      trim: true,
    },
    highlights: {
      type: [String],
      default: [],
    },
    subjects: {
      type: [SubjectSchema],
      default: [],
    },
    announcements: {
      type: [AnnouncementSchema],
      default: [],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedByName: {
      type: String,
      default: "",
      trim: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    publishedByName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

CourseCatalogSchema.index({ course: 1, year: 1 }, { unique: true });

const CourseCatalog =
  mongoose.models.CourseCatalog ||
  mongoose.model("CourseCatalog", CourseCatalogSchema);

export default CourseCatalog;
