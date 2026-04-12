import type { AIFeatures, PatternMatch } from "../../types/index.js";
import { BasePattern } from "./base.js";

/**
 * Gemini (Google) detection patterns.
 *
 * Key behavioral fingerprint:
 * - Minimal/no comments (very low comment density)
 * - No JSDoc blocks at all
 * - No try/catch wrapping
 * - Compact pure functions, functional closures
 * - Map-based data structures
 * - Short average line length (dense code)
 * - Uses template literals
 * - No class-based patterns (pure functional)
 * - Few type annotations (light typing)
 *
 * Gemini is identified partly by ABSENCE of signals: no JSDoc, no try/catch,
 * no verbose comments, no class patterns — combined with compact functional style.
 */

export class GeminiMinimalDocumentationPattern extends BasePattern {
  id = "gemini-minimal-docs";
  name = "Zero JSDoc + very low comment density";
  description = "Gemini writes almost no documentation — no JSDoc at all and minimal comments";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.ast.jsdocCount === 0 &&
      features.ast.commentDensity < 0.05 &&
      features.ast.totalLineCount > 20 &&
      features.ast.functionCount >= 1
    ) {
      return this.createMatch(
        "minimal-documentation",
        0.85,
        0.95,
        `0 JSDoc, ${(features.ast.commentDensity * 100).toFixed(1)}% comment density in ${features.ast.totalLineCount} lines — Gemini's sparse style`,
      );
    }
    return null;
  }
}

export class GeminiNoTryCatchPattern extends BasePattern {
  id = "gemini-no-try-catch";
  name = "No try/catch error handling";
  description = "Gemini avoids try/catch wrapping, letting errors propagate";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.ast.tryCatchCount === 0 &&
      features.ast.functionCount >= 2 &&
      features.ast.totalLineCount > 30 &&
      features.ast.jsdocCount === 0 &&
      features.ast.commentDensity < 0.08
    ) {
      return this.createMatch(
        "no-try-catch",
        0.75,
        0.8,
        `0 try/catch in ${features.ast.functionCount} functions — Gemini skips error wrapping`,
      );
    }
    return null;
  }
}

export class GeminiFunctionalStylePattern extends BasePattern {
  id = "gemini-functional-style";
  name = "Pure functional, no classes";
  description = "Gemini uses functional closures and pure functions without classes";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.ast.classCount === 0 &&
      features.ast.functionCount >= 2 &&
      !features.usesInheritance &&
      features.ast.functionDeclarationCount >= 1
    ) {
      return this.createMatch(
        "functional-no-classes",
        0.7,
        0.75,
        `${features.ast.functionCount} functions, 0 classes — Gemini's functional approach`,
      );
    }
    return null;
  }
}

export class GeminiCompactCodePattern extends BasePattern {
  id = "gemini-compact-code";
  name = "Compact code with short line length";
  description = "Gemini writes dense, compact code with shorter average line lengths";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.ast.avgLineLengthCode > 0 &&
      features.ast.avgLineLengthCode < 45 &&
      features.ast.emptyLineRatio < 0.15 &&
      features.ast.totalLineCount > 15 &&
      features.ast.jsdocCount === 0 &&
      features.ast.commentDensity < 0.06
    ) {
      return this.createMatch(
        "compact-code",
        0.65,
        0.7,
        `Avg line ${features.ast.avgLineLengthCode.toFixed(0)} chars, ${(features.ast.emptyLineRatio * 100).toFixed(0)}% empty — Gemini's dense style`,
      );
    }
    return null;
  }
}

export class GeminiNoGuardClausePattern extends BasePattern {
  id = "gemini-no-guards";
  name = "No guard clause pattern";
  description = "Gemini doesn't use Claude-style guard clauses or early returns heavily";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.ast.guardClauseCount === 0 &&
      features.ast.earlyReturnCount <= 1 &&
      features.ast.functionCount >= 2
    ) {
      return this.createMatch(
        "no-guards",
        0.55,
        0.6,
        `0 guard clauses, ${features.ast.earlyReturnCount} early returns — not guard-clause heavy like Claude`,
      );
    }
    return null;
  }
}

export class GeminiTemplateLiteralPattern extends BasePattern {
  id = "gemini-template-literals";
  name = "Template literal preference";
  description = "Gemini uses template literals more than string concatenation";

  match(features: AIFeatures): PatternMatch | null {
    if (features.ast.templateLiteralCount >= 3) {
      return this.createMatch(
        "template-literals",
        0.5,
        0.55,
        `${features.ast.templateLiteralCount} template literals — Gemini's string preference`,
      );
    }
    return null;
  }
}

export const geminiPatterns = [
  new GeminiMinimalDocumentationPattern(),
  new GeminiNoTryCatchPattern(),
  new GeminiFunctionalStylePattern(),
  new GeminiCompactCodePattern(),
  new GeminiNoGuardClausePattern(),
  new GeminiTemplateLiteralPattern(),
];
