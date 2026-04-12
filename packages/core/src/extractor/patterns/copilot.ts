import type { AIFeatures, PatternMatch } from "../../types/index.js";
import { BasePattern } from "./base.js";

/**
 * GitHub Copilot detection patterns.
 *
 * Key behavioral fingerprint:
 * - Small, scattered edits to EXISTING files (not new files)
 * - Multiple small hunks (inline completions)
 * - Low total added lines per file
 * - No boilerplate/scaffold file creation
 * - Changes feel incremental, not structural
 * - Short avg hunk size (< 8 lines per hunk)
 * - Modifications only, rarely creates new files
 */

export class CopilotScatteredEditsPattern extends BasePattern {
  id = "copilot-scattered-edits";
  name = "Scattered small edits in existing file";
  description = "Copilot produces multiple small hunks of inline completions in existing files";

  match(features: AIFeatures): PatternMatch | null {
    if (features.isScatteredEdit) {
      return this.createMatch(
        "scattered-edits",
        0.9,
        1.0,
        `${features.file.hunks.length} hunks, avg ${features.avgHunkSize.toFixed(1)} lines/hunk in existing file — Copilot inline completions`,
      );
    }
    return null;
  }
}

export class CopilotSmallAdditionsPattern extends BasePattern {
  id = "copilot-small-additions";
  name = "Small targeted additions";
  description = "Copilot typically adds small amounts of code (< 15 lines) to existing files";

  match(features: AIFeatures): PatternMatch | null {
    if (
      !features.isNewFile &&
      features.file.addedLines > 0 &&
      features.file.addedLines <= 15
    ) {
      return this.createMatch(
        "small-additions",
        0.7,
        0.75,
        `${features.file.addedLines} lines added to existing file — Copilot's targeted completion style`,
      );
    }
    return null;
  }
}

export class CopilotNoNewFilePattern extends BasePattern {
  id = "copilot-no-new-file";
  name = "Modification only, no file creation";
  description = "Copilot works within existing files, not creating new ones";

  match(features: AIFeatures): PatternMatch | null {
    if (!features.isNewFile && features.file.addedLines > 0) {
      return this.createMatch(
        "no-new-file",
        0.5,
        0.55,
        `Edit to existing ${features.file.newPath} — Copilot modifies, doesn't scaffold`,
      );
    }
    return null;
  }
}

export class CopilotNoBoilerplatePattern extends BasePattern {
  id = "copilot-no-boilerplate";
  name = "No unprompted boilerplate files";
  description = "Copilot never creates README, types.ts, .env.example, or config files";

  match(features: AIFeatures): PatternMatch | null {
    if (features.isNewFile && features.filenameSignals.length > 0) {
      return this.createMatch(
        "boilerplate-negative",
        -0.5,
        0.5,
        `New boilerplate file ${features.file.newPath} — strongly unlikely to be Copilot`,
      );
    }
    return null;
  }
}

export class CopilotLowCommentDensityPattern extends BasePattern {
  id = "copilot-low-comments";
  name = "Low comment addition density";
  description = "Copilot completions rarely include documentation or comments";

  match(features: AIFeatures): PatternMatch | null {
    if (
      !features.isNewFile &&
      features.ast.jsdocCount === 0 &&
      features.ast.commentDensity < 0.03 &&
      features.file.addedLines > 0 &&
      features.file.addedLines <= 20
    ) {
      return this.createMatch(
        "low-comment-density",
        0.55,
        0.6,
        `No JSDoc, ${(features.ast.commentDensity * 100).toFixed(1)}% comments in small edit — Copilot's code-only completions`,
      );
    }
    return null;
  }
}

export const copilotPatterns = [
  new CopilotScatteredEditsPattern(),
  new CopilotSmallAdditionsPattern(),
  new CopilotNoNewFilePattern(),
  new CopilotNoBoilerplatePattern(),
  new CopilotLowCommentDensityPattern(),
];
