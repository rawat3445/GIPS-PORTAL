import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import { requireStudent } from "../../../lib/auth";
import PortalFeedback from "../../../models/PortalFeedback";
import User from "../../../models/User";

const ALLOWED_FEEDBACK_TYPES = new Set([
  "general",
  "bug",
  "performance",
  "feature",
]);

function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return null;
  return Math.max(1, Math.min(5, Math.round(rating)));
}

function safeText(value, maxLength = 2000) {
  return String(value || "").trim().slice(0, maxLength);
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
    const feedbackType = safeText(body?.feedbackType, 30).toLowerCase();
    const experienceRating = normalizeRating(body?.experienceRating);
    const performanceRating = normalizeRating(body?.performanceRating);
    const title = safeText(body?.title, 160);
    const message = safeText(body?.message, 2000);

    if (!ALLOWED_FEEDBACK_TYPES.has(feedbackType)) {
      return NextResponse.json(
        { message: "Please choose a valid feedback type." },
        { status: 400 },
      );
    }

    if (!experienceRating || !performanceRating) {
      return NextResponse.json(
        { message: "Please provide both experience and performance ratings." },
        { status: 400 },
      );
    }

    if (!message || message.length < 10) {
      return NextResponse.json(
        { message: "Please write at least 10 characters of feedback." },
        { status: 400 },
      );
    }

    const savedFeedback = await PortalFeedback.create({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email || "",
      course: student.course || "",
      year: Number(student.year) || null,
      feedbackType,
      experienceRating,
      performanceRating,
      title,
      message,
      status: "new",
    });

    return NextResponse.json({
      message: "Feedback submitted successfully.",
      feedback: {
        id: String(savedFeedback._id),
        studentName: savedFeedback.studentName,
        feedbackType: savedFeedback.feedbackType,
        experienceRating: savedFeedback.experienceRating,
        performanceRating: savedFeedback.performanceRating,
        createdAt: savedFeedback.createdAt,
      },
    });
  } catch (error) {
    console.error("STUDENT FEEDBACK ERROR:", error);
    return NextResponse.json(
      { message: "Unable to submit feedback right now." },
      { status: 500 },
    );
  }
}
