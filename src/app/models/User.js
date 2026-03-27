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
    assignedCourse: {
      type: String,
      enum: ["BPT", "BOPTOM", "BMRIT", "DOPTOM", "BOTT"],
      required: function () {
        return this.role === "faculty";
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
        return this.role === "student";
      },
    },
  },
  { timestamps: true },
);

const existingUserModel = mongoose.models.User;

if (
  existingUserModel &&
  (!existingUserModel.schema.path("profileImage") ||
    !existingUserModel.schema.path("profileImagePublicId"))
) {
  delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model("User", userSchema);
