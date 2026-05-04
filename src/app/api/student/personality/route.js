import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import { requireStudent } from "../../../lib/auth";
import {
  buildPersonalitySummary,
  createPersonalityProfileDraft,
  evaluatePracticeAnswer,
  normalizePersonalityProfilePayload,
} from "../../../lib/personalityDevelopment";
import { reviewWithXai } from "../../../lib/xaiCoach";
import StudentPersonalityProfile from "../../../models/StudentPersonalityProfile";
import User from "../../../models/User";

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

function serialize(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSafeErrorMessage(error, fallback) {
  const message = String(error?.message || "").trim();
  return message || fallback;
}

function getProfileSetPayload(profile = {}, options = {}) {
  const {
    omitPracticeSessions = false,
    omitReflections = false,
    omitVoiceSessions = false,
  } = options;
  const nextProfile =
    profile && typeof profile === "object" && !Array.isArray(profile) ? { ...profile } : {};

  if (omitPracticeSessions) {
    delete nextProfile.practiceSessions;
  }

  if (omitReflections) {
    delete nextProfile.reflections;
  }

  if (omitVoiceSessions) {
    delete nextProfile.voiceSessions;
  }

  return nextProfile;
}

function formatCreatedLabel(value = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export async function GET() {
  try {
    const student = await getAuthenticatedStudent();
    if (!student) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const existingProfile = await StudentPersonalityProfile.findOne({
      studentId: student._id,
    }).lean();

    const profile = existingProfile || createPersonalityProfileDraft(student);
    const summary = buildPersonalitySummary(profile, student);

    return NextResponse.json({
      exists: Boolean(existingProfile),
      ...summary,
      profile: serialize(summary.profile),
    });
  } catch (error) {
    console.error("GET STUDENT PERSONALITY ERROR:", error);
    return NextResponse.json(
      { message: "Unable to load personality development profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const student = await getAuthenticatedStudent();
    if (!student) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const normalizedProfile = normalizePersonalityProfilePayload(
      body?.profile || body,
      student,
    );

    const savedProfile = await StudentPersonalityProfile.findOneAndUpdate(
      { studentId: student._id },
      {
        $set: {
          studentId: student._id,
          ...normalizedProfile,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    const summary = buildPersonalitySummary(
      savedProfile || normalizedProfile,
      student,
    );

    return NextResponse.json({
      message: "Personality development profile saved",
      ...summary,
      profile: serialize(summary.profile),
    });
  } catch (error) {
    console.error("SAVE STUDENT PERSONALITY ERROR:", error);
    return NextResponse.json(
      {
        message: getSafeErrorMessage(
          error,
          "Unable to save personality development profile",
        ),
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const student = await getAuthenticatedStudent();
    if (!student) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "").trim().toLowerCase();
    const existingProfile = await StudentPersonalityProfile.findOne({
      studentId: student._id,
    }).lean();
    const baseProfile = normalizePersonalityProfilePayload(
      existingProfile || createPersonalityProfileDraft(student),
      student,
    );

    if (action === "practice") {
      const mode = String(body?.mode || "hr-interview").trim().toLowerCase();
      const prompt = String(body?.prompt || "").trim();
      const answer = String(body?.answer || "").trim();

      if (answer.length < 20) {
        return NextResponse.json(
          { message: "Please write a more complete practice answer." },
          { status: 400 },
        );
      }

      let evaluation;

      try {
        evaluation = await reviewWithXai({
          mode,
          prompt,
          answer,
          studentName: student.name,
          course: student.course,
          year: student.year,
        });
      } catch (aiError) {
        const fallback = evaluatePracticeAnswer({
          mode,
          answer,
          studentName: student.name,
        });

        evaluation = {
          ...fallback,
          provider: "fallback",
          model: "local-rule-engine",
          coachMessage:
            aiError.message ||
            "AI coach is unavailable right now, so a local review was used.",
        };
      }

      const practiceSession = {
        id: `practice-${Date.now().toString(36)}`,
        mode,
        prompt,
        answer,
        score: evaluation.score,
        strengths: evaluation.strengths,
        suggestions: evaluation.suggestions,
        improvedAnswer: evaluation.improvedAnswer,
        createdAtLabel: formatCreatedLabel(),
      };

      const savedProfile = await StudentPersonalityProfile.findOneAndUpdate(
        { studentId: student._id },
        {
          $set: {
            studentId: student._id,
            ...getProfileSetPayload(baseProfile, {
              omitPracticeSessions: true,
            }),
          },
          $push: {
            practiceSessions: {
              $each: [practiceSession],
              $slice: -20,
            },
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      ).lean();

      const summary = buildPersonalitySummary(
        savedProfile || {
          ...baseProfile,
          practiceSessions: [
            ...(Array.isArray(baseProfile.practiceSessions)
              ? baseProfile.practiceSessions
              : []),
            practiceSession,
          ],
        },
        student,
      );

      return NextResponse.json({
        message:
          evaluation.provider === "xai"
            ? "AI practice review completed"
            : "Practice reviewed with local fallback",
        evaluation,
        ...summary,
        profile: serialize(summary.profile),
      });
    }

    if (action === "reflection") {
      const prompt = String(body?.prompt || "").trim();
      const response = String(body?.response || "").trim();

      if (response.length < 20) {
        return NextResponse.json(
          { message: "Please write a slightly longer reflection." },
          { status: 400 },
        );
      }

      const reflection = {
        id: `reflection-${Date.now().toString(36)}`,
        prompt,
        response,
        createdAtLabel: formatCreatedLabel(),
      };

      const savedProfile = await StudentPersonalityProfile.findOneAndUpdate(
        { studentId: student._id },
        {
          $set: {
            studentId: student._id,
            ...getProfileSetPayload(baseProfile, {
              omitReflections: true,
            }),
          },
          $push: {
            reflections: {
              $each: [reflection],
              $slice: -20,
            },
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      ).lean();

      const summary = buildPersonalitySummary(
        savedProfile || {
          ...baseProfile,
          reflections: [
            ...(Array.isArray(baseProfile.reflections)
              ? baseProfile.reflections
              : []),
            reflection,
          ],
        },
        student,
      );

      return NextResponse.json({
        message: "Reflection saved",
        ...summary,
        profile: serialize(summary.profile),
      });
    }

    if (action === "voice-session") {
      const mode = String(body?.mode || "hr-interview").trim().toLowerCase();
      const topic = String(body?.topic || "").trim();
      const voice = String(body?.voice || "Eve").trim();
      const durationSeconds = Math.max(
        0,
        Math.min(60 * 30, Math.round(Number(body?.durationSeconds) || 0)),
      );
      const transcript = Array.isArray(body?.transcript) ? body.transcript : [];

      if (!transcript.length) {
        return NextResponse.json(
          { message: "Live session transcript is required to save progress." },
          { status: 400 },
        );
      }

      const voiceSession = {
        id: `voice-${Date.now().toString(36)}`,
        mode,
        topic,
        voice,
        durationSeconds,
        transcript,
        studentTurnCount: transcript.filter(
          (turn) => String(turn?.speaker || "").toLowerCase() === "student",
        ).length,
        coachTurnCount: transcript.filter(
          (turn) => String(turn?.speaker || "").toLowerCase() === "coach",
        ).length,
        transcriptPreview: transcript
          .map((turn) => {
            const speaker =
              String(turn?.speaker || "").toLowerCase() === "coach"
                ? "Coach"
                : "Student";
            return `${speaker}: ${String(turn?.text || "").trim()}`;
          })
          .join(" ")
          .slice(0, 400),
        createdAtLabel: formatCreatedLabel(),
      };

      const savedProfile = await StudentPersonalityProfile.findOneAndUpdate(
        { studentId: student._id },
        {
          $set: {
            studentId: student._id,
            ...getProfileSetPayload(baseProfile, {
              omitVoiceSessions: true,
            }),
          },
          $push: {
            voiceSessions: {
              $each: [voiceSession],
              $slice: -8,
            },
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      ).lean();

      const summary = buildPersonalitySummary(
        savedProfile || {
          ...baseProfile,
          voiceSessions: [
            ...(Array.isArray(baseProfile.voiceSessions)
              ? baseProfile.voiceSessions
              : []),
            voiceSession,
          ].slice(-8),
        },
        student,
      );

      return NextResponse.json({
        message: "Live voice session saved to your personality progress",
        ...summary,
        profile: serialize(summary.profile),
      });
    }

    return NextResponse.json(
      { message: "Unsupported action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("POST STUDENT PERSONALITY ERROR:", error);
    return NextResponse.json(
      {
        message: getSafeErrorMessage(
          error,
          "Unable to process personality development request",
        ),
      },
      { status: 500 },
    );
  }
}
