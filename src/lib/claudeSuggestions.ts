import { getAnthropicClient, getModelCandidates } from "./anthropic";
import { ClaudeSuggestionsSchema, type ClaudeSuggestions } from "./schemas";

function buildPrompt(resumeText: string, jobDescription: string) {
  return `
You are an ATS resume improvement assistant.

Given:
1) Resume text
2) Job description

Return ONLY valid JSON with this exact shape:

{
  "modifications": [
    {
      "id": "mod_1",
      "originalText": "string",
      "suggestedText": "string",
      "reason": "string",
      "sectionHint": "optional string"
    }
  ],
  "restructuring": [
    {
      "id": "rs_1",
      "badge": "add|remove|reorder|improve",
      "severity": "high|medium|low",
      "title": "string",
      "details": "string"
    }
  ]
}

Rules:
- Provide 6–12 modifications max.
- Each modification must be a direct text replacement suggestion (original -> suggested).
- Reasons must be ATS/job-targeted and specific.
- Restructuring is informational only.
- Do NOT include markdown or extra text. JSON ONLY.

Resume:
"""${resumeText}"""

Job Description:
"""${jobDescription}"""
`.trim();
}

function extractText(msg: unknown): string {
  // Anthropic SDK returns content blocks
  const m = msg as { content?: Array<{ type: string; text?: string }> };
  const blocks = m.content ?? [];
  return blocks
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n")
    .trim();
}

function parseJsonLoose(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start)
      return JSON.parse(text.slice(start, end + 1));
    throw new Error("Claude returned non-JSON output");
  }
}

export async function generateSuggestions(
  resumeText: string,
  jobDescription: string
): Promise<ClaudeSuggestions> {
  const anthropic = getAnthropicClient();
  const models = getModelCandidates();

  let lastErr: unknown = null;

  for (const model of models) {
    try {
      const msg = await anthropic.messages.create({
        model,
        max_tokens: 1400,
        temperature: 0.4,
        messages: [
          {
            role: "user",
            content: buildPrompt(resumeText, jobDescription),
          },
        ],
      });

      const text = extractText(msg);
      const parsed = parseJsonLoose(text);
      return ClaudeSuggestionsSchema.parse(parsed);
    } catch (e: unknown) {
      lastErr = e;

      // If model not found, try next
      const maybe = e as { status?: number; message?: string };
      if (maybe.status === 404 && (maybe.message ?? "").includes("model:")) {
        continue;
      }
      throw e;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error("No available Claude model worked for this API key.");
}
