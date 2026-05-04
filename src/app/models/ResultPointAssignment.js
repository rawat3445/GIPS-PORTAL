import mongoose from "mongoose";

const ResultPointAssignmentSchema = new mongoose.Schema(
  {
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
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentResult",
      required: true,
      index: true,
    },
    resultName: {
      type: String,
      required: true,
      trim: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

ResultPointAssignmentSchema.index({ course: 1, year: 1 }, { unique: true });

const ResultPointAssignment =
  mongoose.models.ResultPointAssignment ||
  mongoose.model("ResultPointAssignment", ResultPointAssignmentSchema);

export default ResultPointAssignment;
