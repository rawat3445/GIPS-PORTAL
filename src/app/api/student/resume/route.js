import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import { requireStudent } from "../../../lib/auth";
import {
  buildResumeBuilderAccess,
  createResumeDraft,
  createResumePreviewDraft,
  normalizeResumePayload,
} from "../../../lib/studentResume";
import StudentResume from "../../../models/StudentResume";
import User from "../../../models/User";

async function getAuthenticatedStudent() {
  const auth = await requireStudent();
  if (!auth.ok) {
    return null;
  }

  await connectDB();

  return User.findById(auth.decoded.id).select(
    "name email role phone course year profileImage",
  );
}

function serializeResume(resume) {
  return JSON.parse(JSON.stringify(resume));
}

async function getStudentPointsSummary(request) {
  const summaryResponse = await fetch(
    new URL("/api/student/attendance?view=summary", request.url),
    {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    },
  );

  const summaryData = await summaryResponse.json().catch(() => ({}));

  return {
    ok: summaryResponse.ok,
    status: summaryResponse.status,
    data: summaryData,
    message: summaryData?.message || "Unable to verify student points",
  };
}

export async function GET(request) {
  try {
    const student = await getAuthenticatedStudent();
    if (!student) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const existingResume = await StudentResume.findOne({
      studentId: student._id,
    }).lean();
    const summaryResult = await getStudentPointsSummary(request);
    const access = buildResumeBuilderAccess(summaryResult.data, {
      resumeBuilderUnlockedAt: existingResume?.resumeBuilderUnlockedAt,
    });

    return NextResponse.json({
      exists: Boolean(existingResume),
      resume: existingResume
        ? serializeResume(existingResume)
        : access.canEdit
          ? createResumeDraft(student)
          : createResumePreviewDraft(student),
      access: {
        ...access,
        summaryVerified: summaryResult.ok,
        usingDemoPreview: !existingResume && !access.canEdit,
      },
    });
  } catch (error) {
    console.error("GET STUDENT RESUME ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load resume draft" },
      { status: 500 },
    );
  }
}

async function saveResumeDraft(request) {
  try {
    const student = await getAuthenticatedStudent();
    if (!student) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const existingResume = await StudentResume.findOne({
      studentId: student._id,
    }).lean();
    const summaryResult = await getStudentPointsSummary(request);

    if (!summaryResult.ok) {
      return NextResponse.json(
        { message: summaryResult.message },
        { status: summaryResult.status || 500 },
      );
    }

    const access = buildResumeBuilderAccess(summaryResult.data, {
      resumeBuilderUnlockedAt: existingResume?.resumeBuilderUnlockedAt,
    });

    if (!access.canEdit) {
      return NextResponse.json(
        { message: access.description, access },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const normalizedResume = normalizeResumePayload(body?.resume || body, student);
    const shouldSetUnlockTimestamp =
      !existingResume?.resumeBuilderUnlockedAt && access.qualifiesForFirstUnlock;

    const savedResume = await StudentResume.findOneAndUpdate(
      { studentId: student._id },
      {
        $set: {
          studentId: student._id,
          ...(shouldSetUnlockTimestamp
            ? { resumeBuilderUnlockedAt: new Date() }
            : {}),
          ...normalizedResume,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return NextResponse.json({
      message: shouldSetUnlockTimestamp
        ? "Resume builder unlocked and draft saved"
        : "Resume draft saved",
      resume: serializeResume(savedResume),
      access: {
        ...buildResumeBuilderAccess(summaryResult.data, {
          resumeBuilderUnlockedAt: savedResume?.resumeBuilderUnlockedAt,
        }),
        summaryVerified: true,
        usingDemoPreview: false,
      },
    });
  } catch (error) {
    console.error("SAVE STUDENT RESUME ERROR:", error);
    return NextResponse.json(
      { message: "Unable to save resume draft" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  return saveResumeDraft(request);
}

export async function PUT(request) {
  return saveResumeDraft(request);
}
