import { NextResponse } from "next/server";
import { AnalyzeRequestSchema, AnalyzeResponseSchema } from "@/src/lib/schemas";
import { keywordDiff, scoreFromKeywords } from "@/src/lib/text";
import { generateSuggestions } from "@/src/lib/claudeSuggestions";

export const runtime = "nodejs";

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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analyze failed" },
      { status: 400 }
    );
  }
}
