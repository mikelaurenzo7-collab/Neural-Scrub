import type { AIFeatures, PatternMatch } from "../../types/index.js";
import { BasePattern } from "./base.js";

export class CursorMultiFileComposerPattern extends BasePattern {
  id = "cursor-multi-file-composer";
  name = "Composer-style multi-file edit";
  description = "Cursor Composer tends to coordinate edits across multiple files in one pass";

  match(features: AIFeatures): PatternMatch | null {
    if (
      !features.isNewFile &&
      features.totalFilesInDiff >= 4 &&
      features.file.addedLines >= 12
    ) {
      return this.createMatch(
        "multi-file-composer",
        0.75,
        0.8,
        `${features.totalFilesInDiff} files changed with substantial edit in ${features.file.newPath} — Cursor Composer signature`,
      );
    }
    return null;
  }
}

export class CursorAggressiveRefactorPattern extends BasePattern {
  id = "cursor-aggressive-refactor";
  name = "Aggressive structural refactor";
  description = "Cursor often rewrites aggressively, with high remove/add ratios";

  match(features: AIFeatures): PatternMatch | null {
    const added = features.file.addedLines;
    const removed = features.file.removedLines;
    if (!features.isNewFile && removed >= 20 && removed > added * 0.65) {
      return this.createMatch(
        "aggressive-refactor",
        0.85,
        0.9,
        `${removed} removed vs ${added} added in ${features.file.newPath} — strong refactor-heavy Cursor signal`,
      );
    }
    return null;
  }
}

export class CursorModernSyntaxRefactorPattern extends BasePattern {
  id = "cursor-modern-syntax-refactor";
  name = "Modern syntax sweep in refactor";
  description = "Cursor refactors often introduce optional chaining/nullish patterns in bulk edits";

  match(features: AIFeatures): PatternMatch | null {
    if (
      !features.isNewFile &&
      features.file.addedLines >= 15 &&
      (features.ast.optionalChainCount + features.ast.nullishCoalesceCount) >= 2 &&
      features.file.removedLines >= 10
    ) {
      return this.createMatch(
        "modern-syntax-refactor",
        0.65,
        0.7,
        `${features.ast.optionalChainCount} optional chains + ${features.ast.nullishCoalesceCount} nullish operators during heavy edit — Cursor modernization pattern`,
      );
    }
    return null;
  }
}

export class CursorNotScaffoldPattern extends BasePattern {
  id = "cursor-not-scaffold";
  name = "Not infrastructure scaffolding";
  description = "Cursor is less likely than Devin to focus on infra scaffold files";

  match(features: AIFeatures): PatternMatch | null {
    if (features.isInfrastructureFile && features.isNewFile) {
      return this.createMatch(
        "infra-negative",
        -0.35,
        0.4,
        `New infrastructure file ${features.file.newPath} is less consistent with Cursor than Devin`,
      );
    }
    return null;
  }
}

export const cursorPatterns = [
  new CursorMultiFileComposerPattern(),
  new CursorAggressiveRefactorPattern(),
  new CursorModernSyntaxRefactorPattern(),
  new CursorNotScaffoldPattern(),
];
