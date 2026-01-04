import { NextResponse } from "next/server";
import { z } from "zod";
import { AnalyzeRequestSchema, AnalyzeResponseSchema } from "@/src/lib/schemas";
import { keywordDiff } from "@/src/lib/text";
import { generateSuggestions } from "@/src/lib/claudeSuggestions";
import { getGroundedMatchBreakdown } from "@/src/lib/claudeMatch";
import { computeAtsScoreFromBreakdown } from "@/src/lib/text";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for AWS Amplify

function isDev() {
  return process.env.NODE_ENV !== "production";
}

// simple guard (characters); we'll do token estimation later
const MAX_CHARS = 60_000;

export async function POST(req: Request) {
  const startTime = Date.now();
  
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
    console.log(`[ANALYZE] Starting breakdown analysis (${Date.now() - startTime}ms)`);
    const breakdown = await getGroundedMatchBreakdown({
      resumeText,
      jobDescription,
    });
    console.log(`[ANALYZE] Breakdown complete (${Date.now() - startTime}ms)`);

    // 3) Final match percentage from grounded score
    const matchPercentage = Math.round(breakdown.weightedMatch);

    // 4) ATS score = weighted match + resume quality heuristics
    const atsScore = computeAtsScoreFromBreakdown(
      breakdown.weightedMatch,
      resumeText
    );

    // 5) Suggestions (keep your existing)
    console.log(`[ANALYZE] Starting suggestions (${Date.now() - startTime}ms)`);
    const suggestions = await generateSuggestions(resumeText, jobDescription);
    console.log(`[ANALYZE] Suggestions complete (${Date.now() - startTime}ms)`);

    const response = AnalyzeResponseSchema.parse({
      matchPercentage,
      atsScore,
      presentKeywords,
      missingKeywords,
      suggestions,
      breakdown,
    });

    console.log(`[ANALYZE] Total time: ${Date.now() - startTime}ms`);
    return NextResponse.json(response);
  } catch (e: unknown) {
    const elapsed = Date.now() - startTime;
    console.error(`[ANALYZE_ROUTE_ERROR] (${elapsed}ms):`, e);
    
    // Check if it's a timeout error
    if (e instanceof Error && (e.message.includes('timeout') || e.message.includes('504'))) {
      return NextResponse.json(
        {
          error: "Request timed out. The analysis is taking longer than expected. Please try again with shorter text or contact support.",
        },
        { status: 504 }
      );
    }

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
