import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY in environment");

  return new Anthropic({ apiKey });
}

export function getModelCandidates() {
  // Try env first, then fallbacks
  const envModel = process.env.ANTHROPIC_MODEL?.trim();
  const fallbacks = [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
  ];
  return envModel ? [envModel, ...fallbacks] : fallbacks;
}
