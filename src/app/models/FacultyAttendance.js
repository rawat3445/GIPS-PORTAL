import mongoose from "mongoose";

const FacultyAttendanceRecordSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave", "holiday"],
      required: true,
    },
  },
  { _id: false },
);

const FacultyAttendanceSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    records: {
      type: [FacultyAttendanceRecordSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const existingFacultyAttendanceModel = mongoose.models.FacultyAttendance;
const existingStatusEnum =
  existingFacultyAttendanceModel?.schema.path("records")?.schema?.path("status")
    ?.enumValues || [];

if (
  existingFacultyAttendanceModel &&
  !existingStatusEnum.includes("holiday")
) {
  delete mongoose.models.FacultyAttendance;
}

export default mongoose.models.FacultyAttendance ||
  mongoose.model("FacultyAttendance", FacultyAttendanceSchema);
