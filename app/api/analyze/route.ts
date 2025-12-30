import { NextResponse } from "next/server";
import { z } from "zod";
import { AnalyzeRequestSchema, AnalyzeResponseSchema } from "@/src/lib/schemas";
import { keywordDiff, scoreFromKeywords } from "@/src/lib/text";
import { generateSuggestions } from "@/src/lib/claudeSuggestions";

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

    const { presentKeywords, missingKeywords } = keywordDiff(
      resumeText,
      jobDescription
    );

    const { matchPercentage, atsScore } = scoreFromKeywords(
      presentKeywords,
      missingKeywords,
      resumeText
    );

    const suggestions = await generateSuggestions(resumeText, jobDescription);

    const response = AnalyzeResponseSchema.parse({
      matchPercentage,
      atsScore,
      presentKeywords,
      missingKeywords,
      suggestions,
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
