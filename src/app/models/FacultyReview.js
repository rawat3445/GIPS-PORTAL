import mongoose from "mongoose";

const FacultyReviewResponseSchema = new mongoose.Schema(
  {
    questionKey: {
      type: String,
      required: true,
      trim: true,
    },
    questionLabel: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { _id: false },
);

const FacultyReviewSchema = new mongoose.Schema(
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
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      default: null,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    facultyName: {
      type: String,
      required: true,
      trim: true,
    },
    facultyEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    facultyAssignedCourse: {
      type: String,
      default: "",
      trim: true,
    },
    responses: {
      type: [FacultyReviewResponseSchema],
      default: [],
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true },
);

FacultyReviewSchema.index({ facultyId: 1, createdAt: -1 });
FacultyReviewSchema.index({ course: 1, createdAt: -1 });
FacultyReviewSchema.index({ studentId: 1, facultyId: 1, createdAt: -1 });

const FacultyReview =
  mongoose.models.FacultyReview ||
  mongoose.model("FacultyReview", FacultyReviewSchema);

export default FacultyReview;
