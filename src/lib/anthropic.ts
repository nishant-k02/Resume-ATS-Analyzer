import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY in environment");

  return new Anthropic({ apiKey });
}

export function getModel() {
  return process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
}
