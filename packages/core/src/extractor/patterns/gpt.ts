import type { AIFeatures, PatternMatch } from "../../types/index.js";
import { BasePattern } from "./base.js";

/**
 * GPT-4/4o (OpenAI) detection patterns.
 *
 * Key behavioral fingerprint:
 * - Class-based OOP architecture (class + extends)
 * - EventEmitter / inheritance patterns
 * - Uses let frequently (not const-only)
 * - Uses || for defaults (not ??)
 * - export default pattern
 * - console.log / console.error for debugging
 * - Mixed const/let declarations
 * - Verbose step-by-step comments
 * - Callback-style error handling patterns (err, error)
 */

export class GPTClassInheritancePattern extends BasePattern {
  id = "gpt-class-inheritance";
  name = "Class with inheritance pattern";
  description = "GPT strongly prefers class-based OOP with extends";

  match(features: AIFeatures): PatternMatch | null {
    if (features.usesClassPattern && features.usesInheritance) {
      return this.createMatch(
        "class-inheritance",
        0.9,
        1.0,
        `${features.ast.classCount} classes, ${features.ast.classWithExtendsCount} with extends — GPT's OOP preference`,
      );
    }
    return null;
  }
}

export class GPTLetWithLogicalOrPattern extends BasePattern {
  id = "gpt-let-logical-or";
  name = "let usage + || for defaults";
  description = "GPT uses let and logical OR defaults instead of const + ??";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.ast.letCount > 0 &&
      features.usesLogicalOrDefaults &&
      !features.ast.constOnly
    ) {
      return this.createMatch(
        "let-with-logical-or",
        0.85,
        0.95,
        `${features.ast.letCount} let decls + ${features.ast.logicalOrDefaultCount}x || defaults — GPT pragmatic style`,
      );
    }
    return null;
  }
}

export class GPTExportDefaultPattern extends BasePattern {
  id = "gpt-export-default";
  name = "export default preference";
  description = "GPT frequently uses export default over named exports";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.usesDefaultExport &&
      features.ast.exportDefaultCount > 0 &&
      features.ast.exportNamedCount === 0
    ) {
      return this.createMatch(
        "export-default",
        0.7,
        0.75,
        `${features.ast.exportDefaultCount} export default, 0 named exports — GPT module style`,
      );
    }
    return null;
  }
}

export class GPTConsoleLoggingPattern extends BasePattern {
  id = "gpt-console-logging";
  name = "console.log/error for debugging";
  description = "GPT leaves console.log and console.error calls in code";

  match(features: AIFeatures): PatternMatch | null {
    if (features.ast.consoleLogCount >= 3) {
      return this.createMatch(
        "console-logging",
        0.65,
        0.7,
        `${features.ast.consoleLogCount}x console.* calls — GPT often includes logging`,
      );
    }
    return null;
  }
}

export class GPTCallbackPatternDetector extends BasePattern {
  id = "gpt-callback-pattern";
  name = "Callback-style error handling";
  description = "GPT uses callback-style patterns with (err) or (error) parameters";

  match(features: AIFeatures): PatternMatch | null {
    if (features.ast.callbackPatternCount >= 2) {
      return this.createMatch(
        "callback-pattern",
        0.6,
        0.65,
        `${features.ast.callbackPatternCount}x callback error params — GPT callback-style patterns`,
      );
    }
    return null;
  }
}

export class GPTClassWithMethodsPattern extends BasePattern {
  id = "gpt-class-methods";
  name = "Class-heavy architecture";
  description = "GPT structures code with classes containing multiple methods";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.ast.classCount >= 1 &&
      features.ast.methodCount >= 3 &&
      !features.ast.constOnly
    ) {
      return this.createMatch(
        "class-with-methods",
        0.75,
        0.8,
        `${features.ast.classCount} classes with ${features.ast.methodCount} methods — GPT class-centric architecture`,
      );
    }
    return null;
  }
}

export class GPTVerboseStepCommentsPattern extends BasePattern {
  id = "gpt-verbose-steps";
  name = "Verbose step-by-step comments";
  description = "GPT adds verbose step-by-step comments explaining each block";

  match(features: AIFeatures): PatternMatch | null {
    // Moderate comment density without JSDoc (Claude uses JSDoc)
    if (
      features.ast.commentDensity > 0.08 &&
      features.ast.jsdocCount <= 1 &&
      features.ast.commentLineCount >= 5
    ) {
      return this.createMatch(
        "verbose-step-comments",
        0.55,
        0.6,
        `${features.ast.commentLineCount} comment lines (${(features.ast.commentDensity * 100).toFixed(1)}%) but only ${features.ast.jsdocCount} JSDoc — GPT's inline explanation style`,
      );
    }
    return null;
  }
}

export class GPTFunctionDeclarationStylePattern extends BasePattern {
  id = "gpt-function-declarations";
  name = "function declarations over arrows";
  description = "GPT uses function declarations more than Claude's arrow-only style";

  match(features: AIFeatures): PatternMatch | null {
    if (
      features.ast.functionDeclarationCount >= 2 &&
      features.ast.functionDeclarationCount >= features.ast.arrowFunctionCount
    ) {
      return this.createMatch(
        "function-declarations",
        0.55,
        0.6,
        `${features.ast.functionDeclarationCount} function decls vs ${features.ast.arrowFunctionCount} arrows — GPT uses traditional declarations`,
      );
    }
    return null;
  }
}

export const gptPatterns = [
  new GPTClassInheritancePattern(),
  new GPTLetWithLogicalOrPattern(),
  new GPTExportDefaultPattern(),
  new GPTConsoleLoggingPattern(),
  new GPTCallbackPatternDetector(),
  new GPTClassWithMethodsPattern(),
  new GPTVerboseStepCommentsPattern(),
  new GPTFunctionDeclarationStylePattern(),
];
