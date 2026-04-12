import type { AIFeatures, PatternMatch } from "../../types/index.js";
import { BasePattern } from "./base.js";

/**
 * Claude (Anthropic) detection patterns.
 *
 * Key behavioral fingerprint:
 * - const-only variable declarations (never uses let/var)
 * - Rich JSDoc + inline // Note: / // Important: comments
 * - Creates types.ts, .env.example, README, utils files unprompted
 * - Heavy use of guard clauses / early returns
 * - Comprehensive try/catch wrapping
 * - Uses nullish coalescing (??) over logical OR (||)
 * - Section divider comments (// ─── Section ─────)
 * - Arrow functions strongly preferred over function declarations
 *
 * CRITICAL: Patterns require COMBINATIONS of signals to avoid false positives.
 */

export class ClaudeConstOnlyWithGuardsPattern extends BasePattern {
  id = "claude-const-guards-combo";
  name = "const-only + guard clause combo";
  description = "Claude's strongest signal: const-only declarations combined with guard clauses";

  match(features: AIFeatures): PatternMatch | null {
    const hasNoteSignals =
      features.inlineCommentSignals.includes("note-comment") ||
      features.inlineCommentSignals.includes("important-comment");
    const hasClaudeContext =
      features.isNewFile ||
      hasNoteSignals ||
      features.ast.jsdocCount >= 1 ||
      features.ast.sectionCommentCount >= 1;

    if (
      features.ast.constOnly &&
      features.ast.constCount >= 3 &&
      (features.ast.guardClauseCount >= 2 || features.ast.earlyReturnCount >= 3) &&
      hasClaudeContext
    ) {
      return this.createMatch(
        "const-only-with-guards",
        0.9,
        1.0,
        `${features.ast.constCount} const (0 let/var) + ${features.ast.guardClauseCount} guards + ${features.ast.earlyReturnCount} early returns — strong Claude combo`,
      );
    }
    return null;
  }
}

export class ClaudeJSDocWithNotesPattern extends BasePattern {
  id = "claude-jsdoc-notes-combo";
  name = "JSDoc density + Note:/Important: comments";
  description = "Claude combines high JSDoc density with // Note: and // Important: inline comments";

  match(features: AIFeatures): PatternMatch | null {
    const hasNotes = features.inlineCommentSignals.includes("note-comment");
    const hasImportant = features.inlineCommentSignals.includes("important-comment");
    if (features.ast.jsdocCount >= 2 && (hasNotes || hasImportant)) {
      return this.createMatch(
        "jsdoc-with-notes",
        0.9,
        1.0,
        `${features.ast.jsdocCount} JSDoc blocks + ${hasNotes ? "// Note:" : ""}${hasNotes && hasImportant ? " + " : ""}${hasImportant ? "// Important:" : ""} — Claude documentation style`,
      );
    }
    return null;
  }
}

export class ClaudeUnpromptedTypesFilePattern extends BasePattern {
  id = "claude-types-file";
  name = "Unprompted types/interfaces file";
  description = "Claude frequently creates types.ts or interfaces.ts without being asked";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.isNewFile &&
      (features.filenameSignals.includes("types-file") ||
        features.filenameSignals.includes("interfaces-file"))
    ) {
      return this.createMatch(
        "unprompted-types-file",
        0.85,
        0.9,
        `New file ${features.file.newPath} — Claude creates type definition files unprompted`,
      );
    }
    return null;
  }
}

export class ClaudeReadmePattern extends BasePattern {
  id = "claude-readme";
  name = "Unprompted README creation";
  description = "Claude often adds README files as part of complete responses";

  match(features: AIFeatures): PatternMatch | null {
    if (features.isNewFile && features.filenameSignals.includes("readme")) {
      return this.createMatch(
        "unprompted-readme",
        0.75,
        0.8,
        `New README file ${features.file.newPath} — Claude documentation-first tendency`,
      );
    }
    return null;
  }
}

export class ClaudeEnvExamplePattern extends BasePattern {
  id = "claude-env-example";
  name = "Unprompted .env.example";
  description = "Claude creates .env.example files proactively";

  match(features: AIFeatures): PatternMatch | null {
    if (features.isNewFile && features.filenameSignals.includes("env-example")) {
      return this.createMatch(
        "unprompted-env-example",
        0.8,
        0.85,
        `New file ${features.file.newPath} — Claude creates env templates unprompted`,
      );
    }
    return null;
  }
}

export class ClaudeSectionDividerPattern extends BasePattern {
  id = "claude-section-dividers";
  name = "Section divider comments";
  description = "Claude uses // ─── Section ───── or // === dividers to organize code";

  match(features: AIFeatures): PatternMatch | null {
    if (features.ast.sectionCommentCount >= 2) {
      return this.createMatch(
        "section-dividers",
        0.8,
        0.85,
        `${features.ast.sectionCommentCount} section divider comments — distinctive Claude formatting`,
      );
    }
    return null;
  }
}

export class ClaudeTryCatchDensityPattern extends BasePattern {
  id = "claude-try-catch-density";
  name = "Comprehensive try/catch wrapping";
  description = "Claude wraps most functions in try/catch, especially combined with const-only";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.ast.functionCount >= 2 &&
      features.ast.tryCatchPerFunction > 0.6 &&
      features.ast.constOnly
    ) {
      return this.createMatch(
        "try-catch-density-with-const",
        0.75,
        0.8,
        `${features.ast.tryCatchCount}/${features.ast.functionCount} fns wrapped in try/catch + const-only — Claude defensive style`,
      );
    }
    return null;
  }
}

export class ClaudeNullishCoalescePreferencePattern extends BasePattern {
  id = "claude-nullish-coalesce";
  name = "Nullish coalescing over logical OR";
  description = "Claude prefers ?? over || for defaults";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.ast.nullishCoalesceCount >= 2 &&
      features.ast.logicalOrDefaultCount === 0
    ) {
      return this.createMatch(
        "nullish-coalesce-preference",
        0.65,
        0.7,
        `${features.ast.nullishCoalesceCount}x ?? with 0x || defaults — Claude prefers modern nullish coalescing`,
      );
    }
    return null;
  }
}

export class ClaudeArrowFunctionDominancePattern extends BasePattern {
  id = "claude-arrow-dominance";
  name = "Arrow function dominance";
  description = "Claude strongly prefers arrow functions over function declarations";

  match(features: AIFeatures): PatternMatch | null {
    const total = features.ast.arrowFunctionCount + features.ast.functionDeclarationCount;
    if (
      total >= 3 &&
      features.ast.arrowFunctionCount > 0 &&
      features.ast.functionDeclarationCount === 0 &&
      features.ast.constOnly
    ) {
      return this.createMatch(
        "arrow-function-dominance",
        0.65,
        0.7,
        `${features.ast.arrowFunctionCount} arrows, 0 function decls — Claude const + arrow style`,
      );
    }
    return null;
  }
}

export const claudePatterns = [
  new ClaudeConstOnlyWithGuardsPattern(),
  new ClaudeJSDocWithNotesPattern(),
  new ClaudeUnpromptedTypesFilePattern(),
  new ClaudeReadmePattern(),
  new ClaudeEnvExamplePattern(),
  new ClaudeSectionDividerPattern(),
  new ClaudeTryCatchDensityPattern(),
  new ClaudeNullishCoalescePreferencePattern(),
  new ClaudeArrowFunctionDominancePattern(),
];
