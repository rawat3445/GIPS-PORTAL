function extractJsonBlock(text) {
  const content = String(text || "").trim();
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Model response did not include valid JSON.");
  }

  return content.slice(start, end + 1);
}

function normalizeStringList(values, fallback = []) {
  const items = Array.isArray(values) ? values : fallback;

  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function reviewWithXai({
  mode,
  prompt,
  answer,
  studentName,
  course,
  year,
}) {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "AI coach is not configured yet. Add XAI_API_KEY in your portal .env.local file.",
    );
  }

  const model = process.env.XAI_MODEL || "grok-4.20-reasoning";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "You are a supportive placement and personality development coach for Indian college students. Respond only as compact JSON with keys: score, coachMessage, strengths, suggestions, improvedAnswer. score must be an integer from 1 to 10. strengths and suggestions must be arrays of short strings.",
          },
          {
            role: "user",
            content: `Review this ${mode} practice answer for a student.\nStudent name: ${studentName}\nCourse: ${course}\nYear: ${year}\nPrompt: ${prompt}\nAnswer: ${answer}\nGive practical feedback focused on confidence, structure, clarity, professionalism, and interview readiness. Return JSON only.`,
          },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.error?.message || data?.message || "xAI request failed.",
      );
    }

    const outputMessage = Array.isArray(data?.output)
      ? data.output.find((item) => item?.type === "message")
      : null;
    const outputText = Array.isArray(outputMessage?.content)
      ? outputMessage.content.find((item) => item?.type === "output_text")
      : null;
    const rawContent =
      String(outputText?.text || "").trim() ||
      String(data?.output_text || "").trim() ||
      "";
    const parsed = JSON.parse(extractJsonBlock(rawContent));

    return {
      score: Math.max(1, Math.min(10, Math.round(Number(parsed?.score) || 5))),
      coachMessage:
        String(parsed?.coachMessage || "").trim() ||
        "Your answer has been reviewed by the AI coach.",
      strengths: normalizeStringList(parsed?.strengths, [
        "You attempted the answer clearly.",
      ]),
      suggestions: normalizeStringList(parsed?.suggestions, [
        "Add more structure and confidence to improve it further.",
      ]),
      improvedAnswer: String(parsed?.improvedAnswer || "").trim(),
      provider: "xai",
      model,
    };
  } finally {
    clearTimeout(timeout);
  }
}
