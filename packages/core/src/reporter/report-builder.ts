import type {
  DiffFile,
  FileAnalysis,
  Evidence,
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
  };
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
