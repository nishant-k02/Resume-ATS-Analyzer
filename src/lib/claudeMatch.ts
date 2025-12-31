import { z } from "zod";
import { getAnthropicClient, getModelCandidates } from "./anthropic";
import { MatchBreakdownSchema, type MatchBreakdown } from "./schemas";

const ReqSchema = z.object({
  resumeText: z.string().min(1),
  jobDescription: z.string().min(1),
});

// Strong grounding prompt: quotes required, no invention allowed.
function buildPrompt(resumeText: string, jobDescription: string) {
  return `
You are an ATS scoring engine. You must be STRICTLY GROUNDED in the provided Resume and Job Description.

Task:
1) Extract the most important requirements from the Job Description.
2) Determine if each requirement is satisfied by the Resume.
3) Provide evidence snippets for BOTH JD and Resume. Evidence must be short quotes from the text.
4) Compute weighted match scores.

Return ONLY valid JSON matching this exact shape:

{
  "weightedMatch": 0-100,
  "mustHaveMatch": 0-100,
  "niceToHaveMatch": 0-100,
  "requirements": [
    {
      "id": "req_1",
      "skill": "string",
      "category": "skill|tool|domain|responsibility|cert|soft_skill",
      "importance": "must|nice",
      "weight": 0.0-1.0,
      "evidenceInJD": "short quote from JD",
      "aliases": ["synonym1", "synonym2"]
    }
  ],
  "matched": [
    {
      "requirementId": "req_1",
      "skill": "string",
      "evidenceInResume": "short quote from Resume"
    }
  ],
  "missing": [
    {
      "requirementId": "req_2",
      "skill": "string",
      "suggestion": "What to add IF true (do not fabricate experience). Example: 'If you have used X, add it to Skills or a relevant bullet.'"
    }
  ]
}

Rules (critical):
- Do NOT invent skills or experience. If not clearly present in the Resume, mark as missing.
- Evidence snippets must appear verbatim in the respective texts (short phrases).
- Weights:
  - Must-have requirements should have higher weights than nice-to-have.
  - Sum of weights does not need to be 1, but weights must reflect relative importance.
- Keep requirements to ~12–20 max (focus on the most relevant).
- JSON only. No markdown.

Resume:
"""${resumeText}"""

Job Description:
"""${jobDescription}"""
`.trim();
}

function extractText(msg: unknown): string {
  const m = msg as { content?: Array<{ type: string; text?: string }> };
  return (m.content ?? [])
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

export async function getGroundedMatchBreakdown(
  input: z.infer<typeof ReqSchema>
): Promise<MatchBreakdown> {
  const { resumeText, jobDescription } = ReqSchema.parse(input);
  const anthropic = getAnthropicClient();
  const models = getModelCandidates();

  let lastErr: unknown = null;

  for (const model of models) {
    try {
      const msg = await anthropic.messages.create({
        model,
        max_tokens: 1400,
        temperature: 0.2, // lower temp = more consistent scoring
        messages: [
          { role: "user", content: buildPrompt(resumeText, jobDescription) },
        ],
      });

      const text = extractText(msg);
      const parsed = parseJsonLoose(text);
      return MatchBreakdownSchema.parse(parsed);
    } catch (e: unknown) {
      lastErr = e;
      const maybe = e as { status?: number; message?: string };
      if (maybe.status === 404 && (maybe.message ?? "").includes("model:"))
        continue;
      throw e;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error("No available Claude model worked for this API key.");
}
