import mongoose from "mongoose";

const HolidaySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    fromDate: {
      type: String,
      required: true,
    },
    toDate: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Holiday",
    },
    eventType: {
      type: String,
      enum: ["holiday", "internship", "event"],
      default: "holiday",
    },
    scopeType: {
      type: String,
      enum: ["global", "course", "courseYear", "student"],
      default: "global",
    },
    course: {
      type: String,
      uppercase: true,
      trim: true,
      default: "",
    },
    year: {
      type: Number,
      default: null,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

HolidaySchema.index(
  { date: 1, scopeType: 1, course: 1, year: 1, studentId: 1 },
  { unique: true, name: "holiday_scope_unique" }
);

if (mongoose.models.Holiday) {
  mongoose.deleteModel("Holiday");
}

const Holiday = mongoose.model("Holiday", HolidaySchema);

let ensureIndexesPromise = null;

export async function ensureHolidayIndexes() {
  if (!ensureIndexesPromise) {
    ensureIndexesPromise = (async () => {
      try {
        await Holiday.collection.dropIndex("date_1");
      } catch (error) {
        if (
          error?.codeName !== "IndexNotFound" &&
          error?.codeName !== "NamespaceNotFound"
        ) {
          console.error("Failed to drop old holiday index:", error);
        }
      }

      try {
        await Holiday.collection.dropIndex("date_1_scopeType_1_course_1_year_1");
      } catch (error) {
        if (
          error?.codeName !== "IndexNotFound" &&
          error?.codeName !== "NamespaceNotFound"
        ) {
          console.error("Failed to drop old holiday compound index:", error);
        }
      }

      try {
        await Holiday.collection.dropIndex("holiday_scope_unique");
      } catch (error) {
        if (
          error?.codeName !== "IndexNotFound" &&
          error?.codeName !== "NamespaceNotFound"
        ) {
          console.error("Failed to drop named holiday scope index:", error);
        }
      }

      await Holiday.syncIndexes();
    })().catch((error) => {
      ensureIndexesPromise = null;
      throw error;
    });
  }

  return ensureIndexesPromise;
}

export default Holiday;
