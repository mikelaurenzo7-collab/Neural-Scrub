import type { FingerprintPattern, AIFeatures, PatternMatch } from "../../types/index.js";

export abstract class BasePattern implements FingerprintPattern {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract match(features: AIFeatures): PatternMatch | null;

  protected createMatch(
    signal: string,
    score: number,
    weight: number,
    evidence: string,
  ): PatternMatch {
    return {
      patternId: this.id,
      signal,
      score,
      weight,
      evidence,
    };
  }
}
