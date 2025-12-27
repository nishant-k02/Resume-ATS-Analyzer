import { NextResponse } from "next/server";
import { z } from "zod";
import { AnalyzeRequestSchema, AnalyzeResponseSchema } from "@/src/lib/schemas";
import { keywordDiff, scoreFromKeywords } from "@/src/lib/text";
import { generateSuggestions } from "@/src/lib/claudeSuggestions";

export const runtime = "nodejs";

function isDev() {
  return process.env.NODE_ENV !== "production";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resumeText, jobDescription } = AnalyzeRequestSchema.parse(body);

    const { presentKeywords, missingKeywords } = keywordDiff(
      resumeText,
      jobDescription
    );

    const { matchPercentage, atsScore } = scoreFromKeywords(
      presentKeywords,
      missingKeywords
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
    console.error("ANALYZE_ROUTE_ERROR:", e); // ✅ real root cause in terminal

    // Validation issues → 400
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request/response shape", details: e.issues },
        { status: 400 }
      );
    }

    // Everything else is server/Claude/env problems → 500
    const message = e instanceof Error ? e.message : "Analyze failed";
    const stack = e instanceof Error ? e.stack : undefined;

    return NextResponse.json(
      {
        error: message,
        ...(isDev() && stack ? { stack } : {}),
      },
      { status: 500 }
    );
  }
}
