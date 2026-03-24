import mongoose from "mongoose";

const AttendanceRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: { type: String, enum: ["present", "absent"], required: true },
  },
  { _id: false }
);

const AttendanceSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, uppercase: true, index: true },
    year: { type: Number, required: true, index: true }, // ✅ NEW
    date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    records: { type: [AttendanceRecordSchema], default: [] },
  },
  { timestamps: true }
);

// ✅ unique per course + year + date
AttendanceSchema.index({ course: 1, year: 1, date: 1 }, { unique: true });

const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

let ensureIndexesPromise = null;

export async function ensureAttendanceIndexes() {
  if (!ensureIndexesPromise) {
    ensureIndexesPromise = (async () => {
      try {
        await Attendance.collection.dropIndex("course_1_date_1");
      } catch (error) {
        if (
          error?.codeName !== "IndexNotFound" &&
          error?.codeName !== "NamespaceNotFound"
        ) {
          console.error("Failed to drop old attendance index:", error);
        }
      }

      await Attendance.syncIndexes();
    })();
  }

  return ensureIndexesPromise;
}

export default Attendance;
