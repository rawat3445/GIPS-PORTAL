import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/auth";
import { getUserById, logActivity } from "../../../../lib/activity";
import AttendanceSession from "../../../../models/AttendanceSession";
import User from "../../../../models/User";

export const runtime = "nodejs";

const VALID_COURSES = new Set(["BPT", "BOPTOM", "BMRIT", "DOPTOM", "BOTT"]);

function normalizeRequest(body) {
  const course = String(body?.course || "")
    .trim()
    .toUpperCase();
  const fromYear = Number(body?.fromYear);
  const toYear = Number(body?.toYear);

  if (course && !VALID_COURSES.has(course)) {
    throw new Error("Select a valid course");
  }

  if (!Number.isInteger(fromYear) || fromYear < 1 || fromYear > 3) {
    throw new Error("Students can only be promoted from Years 1, 2, or 3");
  }

  if (toYear !== fromYear + 1 || toYear > 4) {
    throw new Error("Promotion must move students ahead by exactly one year");
  }

  return { course, fromYear, toYear };
}

function buildStudentQuery({ course, fromYear }) {
  return {
    role: "student",
    year: fromYear,
    ...(course ? { course } : {}),
  };
}

async function findActiveAttendanceSessions({ course, fromYear }) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  return AttendanceSession.find({
    year: fromYear,
    status: "open",
    // Old sessions can be left marked as open when a scanner tab is closed.
    // They cannot accept scans after their session date or expiry, so they must
    // not prevent an end-of-year cohort promotion.
    date: { $gte: today },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ],
    ...(course ? { course } : {}),
  })
    .select("course year date sessionCode")
    .lean();
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const { course, fromYear, toYear } = normalizeRequest(body);
    const query = buildStudentQuery({ course, fromYear });
    const openSessions = await findActiveAttendanceSessions({ course, fromYear });

    if (openSessions.length) {
      return NextResponse.json(
        {
          message:
            "Finalize or cancel the active attendance sessions for this cohort before promoting students.",
          openSessions: openSessions.map((session) => ({
            course: session.course,
            year: session.year,
            date: session.date,
            sessionCode: session.sessionCode,
          })),
        },
        { status: 409 },
      );
    }

    const students = await User.find(query)
      .select("_id name email course year session")
      .sort({ course: 1, name: 1 })
      .lean();

    // A preview is always required before a bulk update.
    if (body?.confirm !== true) {
      return NextResponse.json({
        mode: "preview",
        fromYear,
        toYear,
        course: course || "all",
        count: students.length,
        students: students.map((student) => ({
          _id: String(student._id),
          name: student.name,
          email: student.email,
          course: student.course,
          year: student.year,
          session: student.session || "",
        })),
      });
    }

    const requestedIds = Array.isArray(body?.studentIds)
      ? [...new Set(body.studentIds.map((id) => String(id).trim()).filter(Boolean))]
      : [];
    const actualIds = students.map((student) => String(student._id));

    if (
      requestedIds.length !== actualIds.length ||
      requestedIds.some((id) => !actualIds.includes(id))
    ) {
      return NextResponse.json(
        {
          message:
            "The student list changed after the preview. Preview it again before promoting.",
        },
        { status: 409 },
      );
    }

    if (!students.length) {
      return NextResponse.json(
        { message: "No students found for the selected promotion." },
        { status: 404 },
      );
    }

    const result = await User.updateMany(query, { $set: { year: toYear } });
    const actor = await getUserById(auth.decoded.id);
    const cohortLabel = course ? `${course} Year ${fromYear}` : `all courses, Year ${fromYear}`;

    await logActivity({
      actor,
      actionType: "student_promotion",
      actionLabel: "Promoted student cohort",
      path: "/dashboard/admin/students",
      details: `Promoted ${result.modifiedCount} student(s) from ${cohortLabel} to Year ${toYear}`,
      metadata: {
        course: course || "all",
        fromYear,
        toYear,
        studentCount: result.modifiedCount,
        studentIds: actualIds,
      },
    });

    return NextResponse.json({
      message: `${result.modifiedCount} student(s) promoted to Year ${toYear}.`,
      count: result.modifiedCount,
      promotedStudentIds: actualIds,
    });
  } catch (error) {
    console.error("STUDENT PROMOTION ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Unable to promote students" },
      { status: 500 },
    );
  }
}
