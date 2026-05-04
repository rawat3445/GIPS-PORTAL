import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import connectDB from "../../../../lib/db";
import { requireStudent } from "../../../../lib/auth";
import User from "../../../../models/User";

async function getAuthenticatedStudent() {
  const auth = await requireStudent();
  if (!auth.ok) {
    return null;
  }

  await connectDB();

  return User.findById(auth.decoded.id).select("name course year");
}

function getSafeErrorMessage(error, fallback) {
  const direct = String(error?.message || "").trim();
  if (direct) return direct;

  const apiMessage = String(
    error?.error?.message || error?.error || error?.details || "",
  ).trim();
  return apiMessage || fallback;
}

export async function POST() {
  try {
    const student = await getAuthenticatedStudent();
    if (!student) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          message:
            "Live voice conversation is not configured yet. Add GEMINI_API_KEY in .env.local.",
        },
        { status: 500 },
      );
    }

    const model =
      process.env.GEMINI_LIVE_MODEL ||
      "gemini-2.5-flash-native-audio-preview-12-2025";
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1alpha" },
    });
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    try {
      const token = await ai.authTokens.create({
        config: {
          uses: 1,
          expireTime: expiresAt,
          liveConnectConstraints: {
            model,
            config: {
              responseModalities: ["AUDIO"],
              outputAudioTranscription: {},
              inputAudioTranscription: {},
            },
          },
        },
      });

      if (!token?.name) {
        return NextResponse.json(
          {
            message:
              "Gemini returned an auth token response, but no token name was found.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        authToken: token.name,
        model,
        expiresAt,
        recommendedVoice: "Puck",
        sessionWindowSeconds: 300,
        student: {
          name: student?.name || "Student",
          course: student?.course || "",
          year: Number(student?.year) || null,
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          message: getSafeErrorMessage(
            error,
            "Unable to create a live voice session token.",
          ),
        },
        { status: error?.status || 500 },
      );
    }
  } catch (error) {
    console.error("CREATE REALTIME PERSONALITY SESSION ERROR:", error);
    return NextResponse.json(
      {
        message:
          String(error?.message || "").trim() ||
          "Unable to start live voice conversation",
      },
      { status: 500 },
    );
  }
}

