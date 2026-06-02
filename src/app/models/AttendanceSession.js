import mongoose from "mongoose";

const AttendanceSessionSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, uppercase: true, index: true },
    year: { type: Number, required: true, index: true },
    date: { type: String, required: true, index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "finalized", "cancelled"],
      default: "open",
      index: true,
    },
    sessionCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
    finalizedAttendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      default: null,
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    presentCount: {
      type: Number,
      default: 0,
    },
    absentCount: {
      type: Number,
      default: 0,
    },
    rosterCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

AttendanceSessionSchema.index(
  { createdBy: 1, course: 1, year: 1, date: 1, status: 1 },
  { name: "session_lookup_index" },
);

export default
  mongoose.models.AttendanceSession ||
  mongoose.model("AttendanceSession", AttendanceSessionSchema);
