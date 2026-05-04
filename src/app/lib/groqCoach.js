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

export async function reviewWithGroq({
  mode,
  prompt,
  answer,
  studentName,
  course,
  year,
}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "AI coach is not configured yet. Add GROQ_API_KEY in your portal .env.local file.",
    );
  }

  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        messages: [
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
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data?.error?.message || data?.message || "Groq request failed.",
      );
    }

    const rawContent =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.delta?.content ||
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
      provider: "groq",
      model,
    };
  } finally {
    clearTimeout(timeout);
  }
}
