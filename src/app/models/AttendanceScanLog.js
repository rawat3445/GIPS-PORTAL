import mongoose from "mongoose";

const AttendanceScanLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    enrollmentNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    course: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    year: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    scanSource: {
      type: String,
      enum: ["camera", "hardware", "manual"],
      default: "camera",
    },
    rawPayload: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

AttendanceScanLogSchema.index(
  { sessionId: 1, studentId: 1 },
  { unique: true, name: "unique_session_student_scan" },
);

export default
  mongoose.models.AttendanceScanLog ||
  mongoose.model("AttendanceScanLog", AttendanceScanLogSchema);
