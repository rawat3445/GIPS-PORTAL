import mongoose from "mongoose";

const PortalMessageSchema = new mongoose.Schema(
  {
    targetRole: {
      type: String,
      enum: ["student", "faculty"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

PortalMessageSchema.index({ targetRole: 1, createdAt: -1 });

const PortalMessage =
  mongoose.models.PortalMessage ||
  mongoose.model("PortalMessage", PortalMessageSchema);

export default PortalMessage;
