import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
    },
    actorRole: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    actorEmail: {
      type: String,
      default: "",
      trim: true,
    },
    actionType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    actionLabel: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    targetName: {
      type: String,
      default: "",
      trim: true,
    },
    targetRole: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    targetEmail: {
      type: String,
      default: "",
      trim: true,
    },
    path: {
      type: String,
      default: "",
      trim: true,
    },
    details: {
      type: String,
      default: "",
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ actorId: 1, actionType: 1, createdAt: -1 });
ActivityLogSchema.index({ actionType: 1, createdAt: -1 });

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", ActivityLogSchema);

export default ActivityLog;
