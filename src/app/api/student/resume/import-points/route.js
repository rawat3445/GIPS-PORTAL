import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { requireStudent } from "../../../../lib/auth";
import {
  buildResumeBuilderAccess,
  buildAchievementsFromAttendanceSummary,
  buildAchievementsFromPersonalitySummary,
  createResumeDraft,
  mergeImportedAchievements,
} from "../../../../lib/studentResume";
import StudentResume from "../../../../models/StudentResume";
import User from "../../../../models/User";

async function getAuthenticatedStudent() {
  const auth = await requireStudent();
  if (!auth.ok) {
    return null;
  }

  await connectDB();

  return User.findById(auth.decoded.id).select(
    "name email role phone course year enrollmentNo profileImage",
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

async function getStudentPersonalitySummary(request) {
  const response = await fetch(new URL("/api/student/personality", request.url), {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    data,
  };
}

export async function POST(request) {
  try {
    const student = await getAuthenticatedStudent();
    if (!student) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const existingResume = await StudentResume.findOne({
      studentId: student._id,
    }).lean();
    const summaryResult = await getStudentPointsSummary(request);
    const personalityResult = await getStudentPersonalitySummary(request);

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

    const importedAchievements = [
      ...buildAchievementsFromAttendanceSummary(summaryResult.data),
      ...(personalityResult.ok
        ? buildAchievementsFromPersonalitySummary(personalityResult.data)
        : []),
    ];

    const {
      _id,
      __v,
      createdAt,
      updatedAt,
      ...baseResume
    } = existingResume || {
      studentId: student._id,
      ...createResumeDraft(student),
    };

    const mergedAchievements = mergeImportedAchievements(
      baseResume.achievements,
      importedAchievements,
    );
    const importedCount =
      mergedAchievements.length -
      (Array.isArray(baseResume.achievements) ? baseResume.achievements.length : 0);
    const shouldSetUnlockTimestamp =
      !existingResume?.resumeBuilderUnlockedAt && access.qualifiesForFirstUnlock;

    const savedResume = await StudentResume.findOneAndUpdate(
      { studentId: student._id },
      {
        $set: {
          ...baseResume,
          studentId: student._id,
          ...(shouldSetUnlockTimestamp
            ? { resumeBuilderUnlockedAt: new Date() }
            : {}),
          achievements: mergedAchievements,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return NextResponse.json({
      message: importedCount
        ? shouldSetUnlockTimestamp
          ? "Resume builder unlocked and achievements imported from student points"
          : "Achievements imported from student points"
        : "No new points achievements were available to import",
      importedCount,
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
    console.error("IMPORT RESUME POINTS ERROR:", error);
    return NextResponse.json(
      { message: "Unable to import achievements from points" },
      { status: 500 },
    );
  }
}
