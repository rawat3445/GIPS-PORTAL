import mongoose from "mongoose";

const StudentClassTestEntrySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentName: { type: String, default: "", trim: true },
    marksObtained: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pass", "fail", "absent", "pending"],
      default: "pending",
      trim: true,
    },
    remarks: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const StudentClassTestSchema = new mongoose.Schema(
  {
    classTestName: {
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
    subjectCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    subjectName: {
      type: String,
      default: "",
      trim: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    passingMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    extraCriteria: {
      type: String,
      default: "",
      trim: true,
    },
    testDate: {
      type: Date,
      default: null,
    },
    students: {
      type: [StudentClassTestEntrySchema],
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

StudentClassTestSchema.index(
  { classTestName: 1, course: 1, year: 1, subjectCode: 1, subjectName: 1 },
  { unique: true },
);

StudentClassTestSchema.pre("validate", function validateSubject(next) {
  if (!String(this.subjectCode || "").trim() && !String(this.subjectName || "").trim()) {
    this.invalidate(
      "subjectCode",
      "Either subject code or subject name is required.",
    );
  }

  const totalMarks = Number(this.totalMarks || 0);
  const passingMarks = Number(this.passingMarks || 0);
  if (passingMarks > totalMarks) {
    this.invalidate(
      "passingMarks",
      "Passing marks cannot be greater than total marks.",
    );
  }

  next();
});

const existingStudentClassTestModel = mongoose.models.StudentClassTest;
const existingClassTestPaths = Object.keys(
  existingStudentClassTestModel?.schema?.paths || {},
);

if (
  existingStudentClassTestModel &&
  (!existingClassTestPaths.includes("classTestName") ||
    !existingClassTestPaths.includes("subjectCode") ||
    !existingClassTestPaths.includes("subjectName") ||
    !existingClassTestPaths.includes("passingMarks") ||
    !existingClassTestPaths.includes("extraCriteria"))
) {
  delete mongoose.models.StudentClassTest;
}

const StudentClassTest =
  mongoose.models.StudentClassTest ||
  mongoose.model("StudentClassTest", StudentClassTestSchema);

export default StudentClassTest;
