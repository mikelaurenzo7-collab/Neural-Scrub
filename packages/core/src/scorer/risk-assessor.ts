import type { AIFeatures, RiskLevel, UnpromptedChange } from "../types/index.js";

interface RiskRule {
  check(features: AIFeatures): UnpromptedChange | null;
}

const riskRules: RiskRule[] = [
  // HIGH: New dependencies added
  {
    check(features) {
      if (features.addedPackages.length > 0) {
        return {
          file: features.file.newPath,
          description: `Added ${features.addedPackages.length} package(s): ${features.addedPackages.join(", ")}`,
          risk: "high",
          evidence: "New dependencies can introduce supply chain risk",
        };
      }
      return null;
    },
  },
  // HIGH: New config / CI files created unprompted
  {
    check(features) {
      if (
        features.isNewFile &&
        (features.file.newPath.includes(".github/") ||
          features.file.newPath.includes("Dockerfile") ||
          features.file.newPath.endsWith(".yml") ||
          features.file.newPath.endsWith(".yaml"))
      ) {
        return {
          file: features.file.newPath,
          description: "Infrastructure/CI file created",
          risk: "high",
          evidence: "New infrastructure files were not likely requested",
        };
      }
      return null;
    },
  },
  // MEDIUM: Structural refactoring (high remove ratio)
  {
    check(features) {
      if (
        !features.isNewFile &&
        features.file.removedLines > 20 &&
        features.file.removedLines > features.file.addedLines * 0.4
      ) {
        return {
          file: features.file.newPath,
          description: `Structural refactor: ${features.file.removedLines} lines removed, ${features.file.addedLines} added`,
          risk: "medium",
          evidence: "Significant code removal suggests unprompted refactoring",
        };
      }
      return null;
    },
  },
  // MEDIUM: Unprompted utility/helper files
  {
    check(features) {
      if (
        features.isNewFile &&
        (features.filenameSignals.includes("utils-file") ||
          features.filenameSignals.includes("helpers-file") ||
          features.filenameSignals.includes("constants-file"))
      ) {
        return {
          file: features.file.newPath,
          description: "Utility/helper file created unprompted",
          risk: "medium",
          evidence: "Helper files are commonly added by AI without being requested",
        };
      }
      return null;
    },
  },
  // LOW: Cosmetic files (README, .env.example)
  {
    check(features) {
      if (
        features.isNewFile &&
        (features.filenameSignals.includes("readme") ||
          features.filenameSignals.includes("env-example"))
      ) {
        return {
          file: features.file.newPath,
          description: "Documentation/template file created unprompted",
          risk: "low",
          evidence: "Cosmetic file — low risk but wasn't requested",
        };
      }
      return null;
    },
  },
  // LOW: Unprompted type definition files
  {
    check(features) {
      if (
        features.isNewFile &&
        (features.filenameSignals.includes("types-file") ||
          features.filenameSignals.includes("interfaces-file"))
      ) {
        return {
          file: features.file.newPath,
          description: "Type definition file created unprompted",
          risk: "low",
          evidence: "Type files are low risk but may expand scope",
        };
      }
      return null;
    },
  },
];

export function assessRisk(features: AIFeatures): UnpromptedChange[] {
  const changes: UnpromptedChange[] = [];
  for (const rule of riskRules) {
    const change = rule.check(features);
    if (change) {
      changes.push(change);
    }
  }
  return changes;
}

export function overallRisk(changes: UnpromptedChange[]): RiskLevel {
  if (changes.some((c) => c.risk === "high")) return "high";
  if (changes.some((c) => c.risk === "medium")) return "medium";
  if (changes.length > 0) return "low";
  return "low";
}
