import mongoose from "mongoose";

const SubjectDefinitionSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, required: true, trim: true },
    subjectName: { type: String, default: "", trim: true },
    hasTheory: { type: Boolean, default: true },
    hasPractical: { type: Boolean, default: true },
    theoryMax: { type: Number, default: 70, min: 0 },
    practicalMax: { type: Number, default: 30, min: 0 },
  },
  { _id: false },
);

const SubjectResultSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, required: true, trim: true },
    subjectName: { type: String, default: "", trim: true },
    hasTheory: { type: Boolean, default: true },
    hasPractical: { type: Boolean, default: true },
    theoryStatus: {
      type: String,
      enum: ["present", "absent", "pending"],
      default: "present",
      trim: true,
    },
    practicalStatus: {
      type: String,
      enum: ["present", "absent", "pending"],
      default: "present",
      trim: true,
    },
    theoryResultStatus: {
      type: String,
      enum: ["pass", "fail", "pending", "bp", "absent"],
      default: "pending",
      trim: true,
    },
    practicalResultStatus: {
      type: String,
      enum: ["pass", "fail", "pending", "bp", "absent"],
      default: "pending",
      trim: true,
    },
    subjectStatus: {
      type: String,
      enum: ["pass", "fail", "pending", "pwg", "bp", "absent"],
      default: "pending",
      trim: true,
    },
    theoryMarks: { type: Number, default: 0, min: 0 },
    practicalMarks: { type: Number, default: 0, min: 0 },
    theoryMax: { type: Number, default: 70, min: 0 },
    practicalMax: { type: Number, default: 30, min: 0 },
    totalMarks: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const StudentResultEntrySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentName: { type: String, default: "", trim: true },
    subjects: {
      type: [SubjectResultSchema],
      default: [],
    },
    totalMarks: { type: Number, default: 0, min: 0 },
    maxMarks: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0 },
    resultStatus: {
      type: String,
      enum: ["pass", "fail", "pending", "pwg", "bp"],
      default: "pending",
      trim: true,
    },
    remarks: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const StudentResultSchema = new mongoose.Schema(
  {
    resultName: {
      type: String,
      required: true,
      trim: true,
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
      min: 1,
      max: 4,
    },
    subjects: {
      type: [SubjectDefinitionSchema],
      default: [],
    },
    students: {
      type: [StudentResultEntrySchema],
      default: [],
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

StudentResultSchema.index(
  { resultName: 1, course: 1, year: 1 },
  { unique: true },
);

const existingStudentResultModel = mongoose.models.StudentResult;
const existingSubjectsPath = existingStudentResultModel?.schema.path("subjects");
const existingSubjectSchemaPaths = Object.keys(
  existingSubjectsPath?.schema?.paths || {},
);

if (
  existingStudentResultModel &&
  (!existingSubjectsPath?.schema ||
    !existingSubjectSchemaPaths.includes("subjectCode") ||
    !existingSubjectSchemaPaths.includes("hasTheory") ||
    !existingSubjectSchemaPaths.includes("hasPractical") ||
    !existingSubjectSchemaPaths.includes("theoryStatus") ||
    !existingSubjectSchemaPaths.includes("practicalStatus") ||
    !existingSubjectSchemaPaths.includes("theoryResultStatus") ||
    !existingSubjectSchemaPaths.includes("practicalResultStatus") ||
    !existingSubjectSchemaPaths.includes("subjectStatus") ||
    !existingSubjectSchemaPaths.includes("theoryMax") ||
    !existingSubjectSchemaPaths.includes("practicalMax"))
) {
  delete mongoose.models.StudentResult;
}

const StudentResult =
  mongoose.models.StudentResult ||
  mongoose.model("StudentResult", StudentResultSchema);

export default StudentResult;
