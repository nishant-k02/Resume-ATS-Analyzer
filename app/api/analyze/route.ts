import { NextResponse } from "next/server";
import { z } from "zod";
import { AnalyzeRequestSchema, AnalyzeResponseSchema } from "@/src/lib/schemas";
import { keywordDiff, scoreFromKeywords } from "@/src/lib/text";
import { generateSuggestions } from "@/src/lib/claudeSuggestions";
import { getGroundedMatchBreakdown } from "@/src/lib/claudeMatch";
import { computeAtsScoreFromBreakdown } from "@/src/lib/text";

export const runtime = "nodejs";

function isDev() {
  return process.env.NODE_ENV !== "production";
}

// simple guard (characters); we’ll do token estimation later
const MAX_CHARS = 60_000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resumeText, jobDescription } = AnalyzeRequestSchema.parse(body);

    if (resumeText.length + jobDescription.length > MAX_CHARS) {
      return NextResponse.json(
        {
          error:
            "Input too large. Please shorten resume/JD (or remove extra pages) and try again.",
        },
        { status: 413 }
      );
    }

    // 1) Deterministic keyword diff (still useful for badges)
    const { presentKeywords, missingKeywords } = keywordDiff(
      resumeText,
      jobDescription
    );

    // 2) LLM-grounded requirement match (more accurate)
    const breakdown = await getGroundedMatchBreakdown({
      resumeText,
      jobDescription,
    });

    // 3) Final match percentage from grounded score
    const matchPercentage = Math.round(breakdown.weightedMatch);

    // 4) ATS score = weighted match + resume quality heuristics
    const atsScore = computeAtsScoreFromBreakdown(
      breakdown.weightedMatch,
      resumeText
    );

    // 5) Suggestions (keep your existing)
    const suggestions = await generateSuggestions(resumeText, jobDescription);

    const response = AnalyzeResponseSchema.parse({
      matchPercentage,
      atsScore,
      presentKeywords,
      missingKeywords,
      suggestions,
      breakdown,
    });

    return NextResponse.json(response);
  } catch (e: unknown) {
    console.error("ANALYZE_ROUTE_ERROR:", e);

    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request/response shape", details: e.issues },
        { status: 400 }
      );
    }

    const msg =
      e instanceof Error
        ? e.message
        : typeof e === "string"
        ? e
        : "Analyze failed";

    return NextResponse.json(
      {
        error: msg,
        ...(isDev() && e instanceof Error ? { stack: e.stack } : {}),
      },
      { status: 500 }
    );
  }
}
