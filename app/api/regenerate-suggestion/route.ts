import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient, getModelCandidates } from "@/src/lib/anthropic";
import {
  ModificationSuggestionSchema,
  RestructureSuggestionSchema,
} from "@/src/lib/schemas";

export const runtime = "nodejs";

const ReqSchema = z.object({
  resumeText: z.string().min(1),
  jobDescription: z.string().min(1),
  suggestionId: z.string().min(1),
  kind: z.enum(["modification", "restructuring"]),
});

function buildPrompt(
  resumeText: string,
  jobDescription: string,
  suggestionId: string,
  kind: "modification" | "restructuring"
) {
  const shape =
    kind === "modification"
      ? `{
  "id": "${suggestionId}",
  "originalText": "string",
  "suggestedText": "string",
  "reason": "string",
  "sectionHint": "optional string"
}`
      : `{
  "id": "${suggestionId}",
  "badge": "add|remove|reorder|improve",
  "severity": "high|medium|low",
  "title": "string",
  "details": "string"
}`;

  return `
You are an ATS resume improvement assistant.

Regenerate ONE ${kind} suggestion with the same id: "${suggestionId}".

Return ONLY valid JSON of this exact shape:
${shape}

Rules:
- Do NOT include markdown or extra text.
- The suggestion must be job-targeted.

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

export async function POST(req: Request) {
  try {
    const body = ReqSchema.parse(await req.json());
    const anthropic = getAnthropicClient();
    const models = getModelCandidates();

    let lastErr: unknown = null;

    for (const model of models) {
      try {
        const msg = await anthropic.messages.create({
          model,
          max_tokens: 600,
          temperature: 0.6,
          messages: [
            {
              role: "user",
              content: buildPrompt(
                body.resumeText,
                body.jobDescription,
                body.suggestionId,
                body.kind
              ),
            },
          ],
        });

        const text = extractText(msg);
        const parsed = parseJsonLoose(text);

        const suggestion =
          body.kind === "modification"
            ? ModificationSuggestionSchema.parse(parsed)
            : RestructureSuggestionSchema.parse(parsed);

        return NextResponse.json({ suggestion });
      } catch (e: unknown) {
        lastErr = e;
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
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : typeof e === "string" ? e : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
