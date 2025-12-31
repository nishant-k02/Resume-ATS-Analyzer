import { z } from "zod";

export const AnalyzeRequestSchema = z.object({
  resumeText: z.string().min(1),
  jobDescription: z.string().min(1),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const ModificationSuggestionSchema = z.object({
  id: z.string(),
  originalText: z.string(),
  suggestedText: z.string(),
  reason: z.string(),
  // optional hint so UI can group them later
  sectionHint: z.string().optional(),
});

export const RestructureSuggestionSchema = z.object({
  id: z.string(),
  badge: z.enum(["add", "remove", "reorder", "improve"]),
  severity: z.enum(["high", "medium", "low"]),
  title: z.string(),
  details: z.string(),
});

export const ClaudeSuggestionsSchema = z.object({
  modifications: z.array(ModificationSuggestionSchema),
  restructuring: z.array(RestructureSuggestionSchema),
});

export type ClaudeSuggestions = z.infer<typeof ClaudeSuggestionsSchema>;

export const RequirementSchema = z.object({
  id: z.string(),
  skill: z.string(),
  category: z.enum([
    "skill",
    "tool",
    "domain",
    "responsibility",
    "cert",
    "soft_skill",
  ]),
  importance: z.enum(["must", "nice"]),
  weight: z.number().min(0).max(1),
  evidenceInJD: z.string().min(1), // short quote/snippet from JD
  aliases: z.array(z.string()).default([]), // synonyms/variants
});

export const MatchBreakdownSchema = z.object({
  weightedMatch: z.number().min(0).max(100),
  mustHaveMatch: z.number().min(0).max(100),
  niceToHaveMatch: z.number().min(0).max(100),
  matched: z.array(
    z.object({
      requirementId: z.string(),
      skill: z.string(),
      evidenceInResume: z.string().min(1), // short quote/snippet from resume
    })
  ),
  missing: z.array(
    z.object({
      requirementId: z.string(),
      skill: z.string(),
      suggestion: z.string().min(1), // “Add X to Skills section if true”
    })
  ),
  requirements: z.array(RequirementSchema),
});

export type MatchBreakdown = z.infer<typeof MatchBreakdownSchema>;

export const AnalyzeResponseSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  atsScore: z.number().min(0).max(100),
  presentKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  suggestions: ClaudeSuggestionsSchema,
  breakdown: MatchBreakdownSchema,
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
