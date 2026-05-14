import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ================= COMMON =================
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      required: true,
    },

    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    profileImagePublicId: {
      type: String,
      default: "",
      trim: true,
    },

    // ================= FACULTY =================
    facultyType: {
      type: String,
      enum: ["teaching", "nonTeaching"],
      default: "teaching",
      required: function () {
        return this.role === "faculty";
      },
    },

    assignedCourse: {
      type: String,
      enum: ["BPT", "BOPTOM", "BMRIT", "DOPTOM", "BOTT"],
      required: function () {
        return this.role === "faculty" && this.facultyType !== "nonTeaching";
      },
    },

    designation: {
      type: String,
      trim: true,
      required: function () {
        return this.role === "faculty" && this.facultyType === "nonTeaching";
      },
    },

    // ================= STUDENT =================
    enrollmentNo: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // ⭐ CRITICAL FIX
      required: function () {
        return this.role === "student";
      },
    },

    course: {
      type: String,
      enum: ["BPT", "BOPTOM", "BMRIT", "DOPTOM", "BOTT"],
      required: function () {
        return this.role === "student";
      },
    },

    year: {
      type: Number,
      min: 1,
      max: 4,
      required: function () {
        return this.role === "student";
      },
    },

    phone: {
      type: String,
      trim: true,
      required: function () {
        return (
          this.role === "student" ||
          (this.role === "faculty" && this.facultyType === "nonTeaching")
        );
      },
    },

    studentLoginWindowStartDate: {
      type: String,
      default: "",
      trim: true,
    },

    studentLoginResetAt: {
      type: String,
      default: "",
      trim: true,
    },

    studentLastLoginAt: {
      type: Date,
      default: null,
    },

    studentLoginBlocked: {
      type: Boolean,
      default: false,
    },

    studentLoginBlockedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const existingUserModel = mongoose.models.User;
const existingAssignedCourseRequired =
  existingUserModel?.schema.path("assignedCourse")?.options?.required;
const existingPhoneRequired =
  existingUserModel?.schema.path("phone")?.options?.required;

if (
  existingUserModel &&
  (!existingUserModel.schema.path("profileImage") ||
    !existingUserModel.schema.path("profileImagePublicId") ||
    !existingUserModel.schema.path("facultyType") ||
    !existingUserModel.schema.path("studentLoginWindowStartDate") ||
    !existingUserModel.schema.path("studentLoginResetAt") ||
    !existingUserModel.schema.path("studentLastLoginAt") ||
    !existingUserModel.schema.path("studentLoginBlocked") ||
    !existingUserModel.schema.path("studentLoginBlockedAt") ||
    !existingUserModel.schema.path("designation") ||
    !String(existingAssignedCourseRequired || "").includes("facultyType") ||
    !String(existingPhoneRequired || "").includes("facultyType"))
) {
  delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model("User", userSchema);
