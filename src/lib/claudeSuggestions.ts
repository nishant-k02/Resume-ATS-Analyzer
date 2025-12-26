import { getAnthropicClient, getModel } from "./anthropic";
import { ClaudeSuggestionsSchema, type ClaudeSuggestions } from "./schemas";

// IMPORTANT: we force Claude to output JSON only.
function buildPrompt(resumeText: string, jobDescription: string) {
  return `
You are an ATS resume improvement assistant.

Given:
1) Resume text
2) Job description

Return ONLY valid JSON with this exact shape:

{
  "modifications": [
    {
      "id": "mod_1",
      "originalText": "string",
      "suggestedText": "string",
      "reason": "string",
      "sectionHint": "optional string"
    }
  ],
  "restructuring": [
    {
      "id": "rs_1",
      "badge": "add|remove|reorder|improve",
      "severity": "high|medium|low",
      "title": "string",
      "details": "string"
    }
  ]
}

Rules:
- Provide 6–12 modifications max.
- Each modification should be a direct text replacement suggestion (original -> suggested).
- Reasons must be specific and ATS/job-targeted.
- Restructuring suggestions are informational (no rewriting entire resume).
- Do NOT include markdown, code blocks, or extra commentary. JSON ONLY.

Resume:
"""${resumeText}"""

Job Description:
"""${jobDescription}"""
`.trim();
}

// Minimal block types we need (avoids `any`)
type AnthropicTextBlock = { type: "text"; text: string };
type AnthropicNonTextBlock = { type: string }; // e.g. tool_use, thinking, etc.
type AnthropicContentBlock = AnthropicTextBlock | AnthropicNonTextBlock;

function isTextBlock(
  block: AnthropicContentBlock
): block is AnthropicTextBlock {
  return block.type === "text";
}

export async function generateSuggestions(
  resumeText: string,
  jobDescription: string
): Promise<ClaudeSuggestions> {
  const anthropic = getAnthropicClient();
  const model = getModel();

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 1400,
    temperature: 0.4,
    messages: [
      {
        role: "user",
        content: buildPrompt(resumeText, jobDescription),
      },
    ],
  });

  // Anthropic SDK returns content blocks; extract only text blocks.
  const content = msg.content as AnthropicContentBlock[];

  const text = content
    .filter(isTextBlock)
    .map((b) => b.text)
    .join("\n")
    .trim();

  // parse JSON safely
  const parsed = parseJsonObject(text);

  return ClaudeSuggestionsSchema.parse(parsed);
}

function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("Claude returned non-JSON output");
  }
}
