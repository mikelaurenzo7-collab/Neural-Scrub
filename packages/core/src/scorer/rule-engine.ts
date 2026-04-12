import type {
  AIFeatures,
  FingerprintPattern,
  ModelId,
  PatternMatch,
  SentinelScore,
} from "../types/index.js";
import { allPatterns } from "../extractor/patterns/index.js";

const MODEL_DISPLAY_NAMES: Record<ModelId, string> = {
  claude: "Claude (Anthropic)",
  gpt: "GPT-4/4o (OpenAI)",
  gemini: "Gemini (Google)",
  copilot: "GitHub Copilot",
  cursor: "Cursor",
  windsurf: "Windsurf",
  devin: "Devin (Cognition)",
};

const MODEL_PATTERN_COUNT: Record<ModelId, number> = {
  claude: 9,
  gpt: 8,
  gemini: 6,
  copilot: 5,
  cursor: 4,
  windsurf: 4,
  devin: 7,
};

// Map pattern ID prefixes to model IDs
function patternToModel(patternId: string): ModelId {
  const prefix = patternId.split("-")[0]!;
  const map: Record<string, ModelId> = {
    claude: "claude",
    gpt: "gpt",
    gemini: "gemini",
    copilot: "copilot",
    cursor: "cursor",
    windsurf: "windsurf",
    devin: "devin",
  };
  return map[prefix] ?? "gpt";
}

export interface RuleEngine {
  score(features: AIFeatures): SentinelScore[];
}

export function createRuleEngine(
  patterns: FingerprintPattern[] = allPatterns,
): RuleEngine {
  return {
    score(features: AIFeatures): SentinelScore[] {
      // Collect all matches
      const matches: PatternMatch[] = [];
      for (const pattern of patterns) {
        const match = pattern.match(features);
        if (match) {
          matches.push(match);
        }
      }

      // Group by model
      const modelMatches = new Map<ModelId, PatternMatch[]>();
      for (const match of matches) {
        const modelId = patternToModel(match.patternId);
        const existing = modelMatches.get(modelId) ?? [];
        existing.push(match);
        modelMatches.set(modelId, existing);
      }

      // Calculate weighted scores per model.
      // Confidence is normalized by each model's available pattern count
      // to avoid favoring models with more defined rules.
      const scores: SentinelScore[] = [];
      for (const [modelId, mMatches] of modelMatches) {
        const totalWeight = mMatches.reduce((sum, m) => sum + m.weight, 0);
        const weightedScore =
          totalWeight > 0
            ? mMatches.reduce((sum, m) => sum + m.score * m.weight, 0) / totalWeight
            : 0;

        const expectedPatterns = MODEL_PATTERN_COUNT[modelId] ?? 6;
        const coverage = Math.min(mMatches.length / expectedPatterns, 1);
        const confidence = Math.max(0, Math.min(weightedScore * (0.55 + coverage * 0.45), 1));

        scores.push({
          modelId,
          displayName: MODEL_DISPLAY_NAMES[modelId] ?? modelId,
          confidence,
          weightedScore,
          matches: mMatches,
        });
      }

      // Sort by confidence descending
      scores.sort((a, b) => b.confidence - a.confidence);

      return scores;
    },
  };
}
