import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL ?? null;

  return NextResponse.json({
    hasKey,
    model,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
