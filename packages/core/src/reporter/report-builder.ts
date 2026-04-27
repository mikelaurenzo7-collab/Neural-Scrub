import type {
  DiffFile,
  FileAnalysis,
  Evidence,
  Recommendation,
  SentinelReport,
  ReportSummary,
  SentinelScore,
  ModelId,
} from "../types/index.js";
import { extractFeatures } from "../extractor/feature-extractor.js";
import { createRuleEngine } from "../scorer/rule-engine.js";
import { assessRisk, overallRisk } from "../scorer/risk-assessor.js";

export function buildReport(
  files: DiffFile[],
  repoPath: string,
  commitRange?: string,
): SentinelReport {
  const engine = createRuleEngine();
  const fileAnalyses: FileAnalysis[] = [];

  for (const file of files) {
    const features = extractFeatures(file);
    features.totalFilesInDiff = files.length;
    const scores = engine.score(features);
    const unpromptedChanges = assessRisk(features);

    fileAnalyses.push({
      file,
      features,
      scores,
      topModel: scores[0] ?? null,
      unpromptedChanges,
    });
  }

  const summary = buildSummary(fileAnalyses);

  return {
    generatedAt: new Date().toISOString(),
    repoPath,
    commitRange,
    totalFiles: files.length,
    totalAddedLines: files.reduce((sum, f) => sum + f.addedLines, 0),
    totalRemovedLines: files.reduce((sum, f) => sum + f.removedLines, 0),
    files: fileAnalyses,
    summary,
  };
}

function buildSummary(analyses: FileAnalysis[]): ReportSummary {
  // Aggregate scores across all files
  const modelScoreMap = new Map<ModelId, { totalConf: number; count: number; matches: SentinelScore["matches"] }>();

  for (const analysis of analyses) {
    for (const score of analysis.scores) {
      const entry = modelScoreMap.get(score.modelId) ?? {
        totalConf: 0,
        count: 0,
        matches: [],
      };
      entry.totalConf += score.confidence;
      entry.count++;
      entry.matches.push(...score.matches);
      modelScoreMap.set(score.modelId, entry);
    }
  }

  const modelBreakdown: SentinelScore[] = [];
  for (const [modelId, data] of modelScoreMap) {
    const matchedFileAverage = data.count > 0 ? data.totalConf / data.count : 0;
    const coverageAdjustedConfidence = analyses.length > 0 ? data.totalConf / analyses.length : 0;

    modelBreakdown.push({
      modelId,
      displayName: getDisplayName(modelId),
      confidence: coverageAdjustedConfidence,
      weightedScore: matchedFileAverage,
      matches: data.matches,
    });
  }
  modelBreakdown.sort((a, b) => b.confidence - a.confidence);

  const allUnprompted = analyses.flatMap((a) => a.unpromptedChanges);

  // Build evidence trail
  const evidenceTrail: Evidence[] = [];
  for (const analysis of analyses) {
    for (const score of analysis.scores) {
      for (const match of score.matches) {
        evidenceTrail.push({
          patternId: match.patternId,
          file: analysis.file.newPath,
          snippet: match.evidence,
          explanation: `${match.signal} (score: ${match.score.toFixed(2)}, weight: ${match.weight.toFixed(2)})`,
        });
      }
    }
  }

  return {
    dominantModel: modelBreakdown[0] ?? null,
    modelBreakdown,
    unpromptedChanges: allUnprompted,
    riskScore: overallRisk(allUnprompted),
    evidenceTrail,
    recommendations: buildRecommendations(allUnprompted, modelBreakdown, evidenceTrail),
  };
}

function buildRecommendations(
  unpromptedChanges: FileAnalysis["unpromptedChanges"],
  modelBreakdown: SentinelScore[],
  evidenceTrail: Evidence[],
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const highRiskFiles = uniqueFiles(unpromptedChanges.filter((c) => c.risk === "high").map((c) => c.file));
  const dependencyFiles = uniqueFiles(
    unpromptedChanges.filter((c) => c.description.startsWith("Added ")).map((c) => c.file),
  );
  const infrastructureFiles = uniqueFiles(
    unpromptedChanges.filter((c) => c.description.includes("Infrastructure/CI")).map((c) => c.file),
  );
  const scopedExpansionFiles = uniqueFiles(
    unpromptedChanges.filter((c) => c.risk !== "high").map((c) => c.file),
  );
  const dominant = modelBreakdown[0] ?? null;

  if (highRiskFiles.length > 0) {
    recommendations.push({
      priority: "high",
      title: "Require explicit review for high-risk scope expansion",
      description: "Block merge until each high-risk file is mapped to a requested task or explicitly approved.",
      affectedFiles: highRiskFiles,
      rationale: "High-risk unprompted changes can alter infrastructure, dependencies, or supply-chain posture.",
    });
  }

  if (dependencyFiles.length > 0) {
    recommendations.push({
      priority: "high",
      title: "Audit newly added dependencies",
      description: "Verify package reputation, license, transitive dependency risk, and whether the dependency is necessary.",
      affectedFiles: dependencyFiles,
      rationale: "New packages expand the attack surface and can introduce supply-chain vulnerabilities.",
    });
  }

  if (infrastructureFiles.length > 0) {
    recommendations.push({
      priority: "high",
      title: "Validate infrastructure and CI changes in isolation",
      description: "Review permissions, secrets access, triggers, and deployment impact before enabling these files.",
      affectedFiles: infrastructureFiles,
      rationale: "Infrastructure changes can affect build integrity, deployment behavior, and credential exposure.",
    });
  }

  if (scopedExpansionFiles.length > 0) {
    recommendations.push({
      priority: "medium",
      title: "Trim or document lower-risk unprompted additions",
      description: "Keep files only when they directly support the requested change; otherwise defer them to a follow-up.",
      affectedFiles: scopedExpansionFiles,
      rationale: "Documentation, helper, and type additions are usually low-friction but can still hide scope creep.",
    });
  }

  if (dominant && dominant.confidence >= 0.5) {
    recommendations.push({
      priority: "medium",
      title: "Correlate attribution with session context",
      description: "Compare the dominant model signal against prompts, editor history, and commit metadata.",
      affectedFiles: uniqueFiles(evidenceTrail.map((e) => e.file)),
      rationale: `${dominant.displayName} is the strongest detected fingerprint at ${(dominant.confidence * 100).toFixed(1)}% confidence.`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: "low",
      title: "Preserve baseline evidence for future comparisons",
      description: "Export the JSON report and compare it with future diffs to spot attribution or scope shifts over time.",
      affectedFiles: [],
      rationale: "No strong risk signals were detected, so the report is most useful as a historical baseline.",
    });
  }

  return recommendations;
}

function uniqueFiles(files: string[]): string[] {
  return [...new Set(files)].sort();
}

function getDisplayName(modelId: ModelId): string {
  const names: Record<ModelId, string> = {
    claude: "Claude (Anthropic)",
    gpt: "GPT-4/4o (OpenAI)",
    gemini: "Gemini (Google)",
    copilot: "GitHub Copilot",
    cursor: "Cursor",
    windsurf: "Windsurf",
    devin: "Devin (Cognition)",
  };
  return names[modelId] ?? modelId;
}
