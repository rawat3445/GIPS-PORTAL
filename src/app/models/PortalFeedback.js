import mongoose from "mongoose";

const PortalFeedbackSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    course: {
      type: String,
      default: "",
      trim: true,
    },
    year: {
      type: Number,
      default: null,
    },
    feedbackType: {
      type: String,
      enum: ["general", "bug", "performance", "feature"],
      default: "general",
      trim: true,
    },
    experienceRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    performanceRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "resolved"],
      default: "new",
      trim: true,
    },
  },
  { timestamps: true },
);

PortalFeedbackSchema.index({ createdAt: -1 });

const PortalFeedback =
  mongoose.models.PortalFeedback ||
  mongoose.model("PortalFeedback", PortalFeedbackSchema);

export default PortalFeedback;
