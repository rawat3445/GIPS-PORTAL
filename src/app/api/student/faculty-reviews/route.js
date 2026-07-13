import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import { requireStudent } from "../../../lib/auth";
import User from "../../../models/User";
import FacultyReview from "../../../models/FacultyReview";
import {
  FACULTY_REVIEW_QUESTIONS,
  calculateFacultyReviewOverallRating,
  getSubmittedFacultyReviewResponses,
} from "../../../lib/facultyReview";

function safeText(value, maxLength = 2000) {
  return String(value || "").trim().slice(0, maxLength);
}

function formatFacultyOption(doc) {
  return {
    _id: String(doc._id),
    name: doc.name || "Faculty",
    email: doc.email || "",
    assignedCourse: doc.assignedCourse || "",
  };
}

export async function GET() {
  try {
    const auth = await requireStudent();
    if (!auth.ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const student = await User.findById(auth.decoded.id).select(
      "name email course year role",
    );

    if (!student || String(student.role || "").toLowerCase() !== "student") {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const faculty = await User.find({
      role: "faculty",
      facultyType: "teaching",
      assignedCourse: String(student.course || "").trim().toUpperCase(),
    })
      .select("name email assignedCourse")
      .sort({ name: 1 });

    return NextResponse.json({
      student: {
        name: student.name || "",
        email: student.email || "",
        course: student.course || "",
        year: Number(student.year || 0) || null,
      },
      faculty: faculty.map(formatFacultyOption),
      questions: FACULTY_REVIEW_QUESTIONS,
      privacyNote:
        "Your review is kept confidential and is not shown to faculty or other students.",
    });
  } catch (error) {
    console.error("STUDENT FACULTY REVIEW GET ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load faculty review form right now." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const student = await User.findById(auth.decoded.id).select(
      "name email course year role",
    );

    if (!student || String(student.role || "").toLowerCase() !== "student") {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const facultyId = safeText(body?.facultyId, 80);
    const comment = safeText(body?.comment, 2000);
    const responses = getSubmittedFacultyReviewResponses(body?.responses);

    if (!facultyId) {
      return NextResponse.json(
        { message: "Please choose a faculty member." },
        { status: 400 },
      );
    }

    if (!comment && responses.length === 0) {
      return NextResponse.json(
        { message: "Please add at least one rating or write a comment." },
        { status: 400 },
      );
    }

    const hasInvalidSubmittedRating = (Array.isArray(body?.responses) ? body.responses : [])
      .some((item) => {
        if (item?.rating === undefined || item?.rating === null || item?.rating === "") {
          return false;
        }

        const value = Number(item.rating);
        return !Number.isFinite(value) || value < 1 || value > 5;
      });

    if (hasInvalidSubmittedRating) {
      return NextResponse.json(
        { message: "Ratings must stay between 1 and 5." },
        { status: 400 },
      );
    }

    const faculty = await User.findOne({
      _id: facultyId,
      role: "faculty",
      facultyType: "teaching",
      assignedCourse: String(student.course || "").trim().toUpperCase(),
    }).select("name email assignedCourse role facultyType");

    if (!faculty) {
      return NextResponse.json(
        { message: "Faculty member not found for your course." },
        { status: 404 },
      );
    }

    const overallRating =
      responses.length > 0
        ? calculateFacultyReviewOverallRating(responses)
        : null;

    const savedReview = await FacultyReview.create({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email || "",
      course: student.course || "",
      year: Number(student.year || 0) || null,
      facultyId: faculty._id,
      facultyName: faculty.name,
      facultyEmail: faculty.email || "",
      facultyAssignedCourse: faculty.assignedCourse || "",
      responses,
      overallRating,
      comment,
    });

    return NextResponse.json({
      message: "Faculty review submitted successfully.",
      review: {
        id: String(savedReview._id),
        facultyName: savedReview.facultyName,
        overallRating: savedReview.overallRating ?? 0,
        createdAt: savedReview.createdAt,
      },
    });
  } catch (error) {
    console.error("STUDENT FACULTY REVIEW POST ERROR:", error);
    return NextResponse.json(
      { message: "Unable to submit faculty review right now." },
      { status: 500 },
    );
  }
}
