import type { AIFeatures, PatternMatch } from "../../types/index.js";
import { BasePattern } from "./base.js";

export class WindsurfBalancedEditPattern extends BasePattern {
  id = "windsurf-balanced-edit";
  name = "Balanced iterative edits";
  description = "Windsurf Cascade tends toward moderate, balanced add/remove edits";

  match(features: AIFeatures): PatternMatch | null {
    const add = features.file.addedLines;
    const remove = features.file.removedLines;
    const ratio = remove > 0 ? add / remove : 0;
    if (!features.isNewFile && add >= 8 && add <= 60 && remove >= 4 && ratio > 0.6 && ratio < 1.8) {
      return this.createMatch(
        "balanced-iterative-edit",
        0.7,
        0.75,
        `Balanced delta ${add}+/${remove}- in existing file (${ratio.toFixed(2)} add/remove ratio) — Windsurf flow style`,
      );
    }
    return null;
  }
}

export class WindsurfMidHunkPattern extends BasePattern {
  id = "windsurf-mid-hunk";
  name = "Mid-sized hunk cadence";
  description = "Windsurf often yields medium hunk sizes, unlike Copilot's tiny scattered edits";

  match(features: AIFeatures): PatternMatch | null {
    if (!features.isNewFile && features.avgHunkSize >= 8 && features.avgHunkSize <= 20) {
      return this.createMatch(
        "mid-hunk-cadence",
        0.6,
        0.65,
        `${features.file.hunks.length} hunks averaging ${features.avgHunkSize.toFixed(1)} lines — Windsurf iterative cadence`,
      );
    }
    return null;
  }
}

export class WindsurfFunctionalRefinementPattern extends BasePattern {
  id = "windsurf-functional-refinement";
  name = "Functional refinement edits";
  description = "Windsurf commonly refines existing logic with moderate function-level changes";

  match(features: AIFeatures): PatternMatch | null {
    if (
      !features.isNewFile &&
      features.ast.functionCount >= 1 &&
      features.ast.classCount === 0 &&
      features.file.addedLines >= 10 &&
      features.file.removedLines >= 5
    ) {
      return this.createMatch(
        "functional-refinement",
        0.55,
        0.6,
        `Functional changes (${features.ast.functionCount} functions, no classes) with moderate churn — Windsurf refinement pattern`,
      );
    }
    return null;
  }
}

export class WindsurfNotInfraScaffoldPattern extends BasePattern {
  id = "windsurf-not-infra";
  name = "Not infrastructure scaffold";
  description = "Windsurf is less likely than Devin to produce fresh infra scaffolds";

  match(features: AIFeatures): PatternMatch | null {
    if (features.isInfrastructureFile && features.isNewFile) {
      return this.createMatch(
        "infra-negative",
        -0.25,
        0.3,
        `New infrastructure file ${features.file.newPath} is less characteristic of Windsurf`,
      );
    }
    return null;
  }
}

export const windsurfPatterns = [
  new WindsurfBalancedEditPattern(),
  new WindsurfMidHunkPattern(),
  new WindsurfFunctionalRefinementPattern(),
  new WindsurfNotInfraScaffoldPattern(),
];
