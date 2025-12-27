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
- Each modification should be a direct text replacement suggestion (original -> suggested).
- Reasons must be specific and ATS/job-targeted.
- Restructuring suggestions are informational only.
- Do NOT include markdown, code blocks, or extra commentary. JSON ONLY.

Resume:
"""${resumeText}"""

Job Description:
"""${jobDescription}"""
`.trim();
}

type ClaudeContentBlock = {
  type?: string;
  text?: string;
};

interface ClaudeResponse {
  content?: ClaudeContentBlock[] | null;
  [key: string]: unknown;
}

function extractTextBlocks(msg: unknown) {
  const content = (() => {
    if (!msg || typeof msg !== "object") return [];
    const c = (msg as ClaudeResponse).content;
    return c ?? [];
  })() as ClaudeContentBlock[];

  return content
    .filter((b): b is ClaudeContentBlock => b?.type === "text")
    .map((b) => b.text ?? "")
    .join("\n")
    .trim();
}

function parseJsonLoose(text: string) {
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
          { role: "user", content: buildPrompt(resumeText, jobDescription) },
        ],
      });

      const text = extractTextBlocks(msg);
      const parsed = parseJsonLoose(text);
      return ClaudeSuggestionsSchema.parse(parsed);
    } catch (e: unknown) {
      lastErr = e;

      // Normalize unknown error to a shaped object for property access
      const err = e as { status?: number; message?: string };

      // If model not found, try the next one
      const status = err.status;
      const message = err.message ?? "";
      const isModelNotFound = status === 404 && message.includes("model:");

      if (isModelNotFound) continue;

      // For non-model errors, stop immediately
      throw e;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error("No available Claude model worked for this API key.");
}
