import type { SentinelReport } from "../../types/index.js";

export function formatText(report: SentinelReport): string {
  const lines: string[] = [];

  lines.push("╔══════════════════════════════════════════════════════════╗");
  lines.push("║            SENTINEL — AI Fingerprint Report             ║");
  lines.push("╚══════════════════════════════════════════════════════════╝");
  lines.push("");
  lines.push(`  Repository:   ${report.repoPath}`);
  if (report.commitRange) {
    lines.push(`  Commit Range: ${report.commitRange}`);
  }
  lines.push(`  Generated:    ${report.generatedAt}`);
  lines.push(`  Files:        ${report.totalFiles}`);
  lines.push(`  Lines:        +${report.totalAddedLines} / -${report.totalRemovedLines}`);
  lines.push("");

  // Summary
  lines.push("─── Summary ───────────────────────────────────────────────");
  if (report.summary.dominantModel) {
    lines.push(
      `  Dominant Model: ${report.summary.dominantModel.displayName} (${(report.summary.dominantModel.confidence * 100).toFixed(1)}% confidence)`,
    );
  } else {
    lines.push("  Dominant Model: No strong signal detected");
  }
  lines.push(`  Risk Level:     ${report.summary.riskScore.toUpperCase()}`);
  lines.push("");

  // Model breakdown
  if (report.summary.modelBreakdown.length > 0) {
    lines.push("─── Model Attribution ─────────────────────────────────────");
    for (const score of report.summary.modelBreakdown) {
      const bar = progressBar(score.confidence, 20);
      lines.push(
        `  ${score.displayName.padEnd(25)} ${bar} ${(score.confidence * 100).toFixed(1)}%`,
      );
    }
    lines.push("");
  }

  // Per-file breakdown
  lines.push("─── File Analysis ─────────────────────────────────────────");
  for (const analysis of report.files) {
    const topLabel = analysis.topModel
      ? `→ ${analysis.topModel.displayName} (${(analysis.topModel.confidence * 100).toFixed(0)}%)`
      : "→ No signal";
    lines.push(
      `  ${analysis.file.newPath.padEnd(40)} +${analysis.file.addedLines}/-${analysis.file.removedLines}  ${topLabel}`,
    );
  }
  lines.push("");

  // Unprompted changes
  if (report.summary.unpromptedChanges.length > 0) {
    lines.push("─── Unprompted Changes ────────────────────────────────────");
    for (const change of report.summary.unpromptedChanges) {
      const icon = change.risk === "high" ? "!!" : change.risk === "medium" ? " !" : " ~";
      lines.push(`  [${icon}] ${change.file}: ${change.description}`);
      lines.push(`       ${change.evidence}`);
    }
    lines.push("");
  }

  // Recommendations
  if (report.summary.recommendations.length > 0) {
    lines.push("─── Recommended Next Actions ──────────────────────────────");
    for (const rec of report.summary.recommendations) {
      lines.push(`  [${rec.priority.toUpperCase()}] ${rec.title}`);
      lines.push(`       ${rec.description}`);
      if (rec.affectedFiles.length > 0) {
        lines.push(`       Files: ${rec.affectedFiles.join(", ")}`);
      }
    }
    lines.push("");
  }

  // Evidence trail
  if (report.summary.evidenceTrail.length > 0) {
    lines.push("─── Evidence Trail ────────────────────────────────────────");
    for (const ev of report.summary.evidenceTrail.slice(0, 20)) {
      lines.push(`  ${ev.file}: ${ev.snippet}`);
    }
    if (report.summary.evidenceTrail.length > 20) {
      lines.push(`  ... and ${report.summary.evidenceTrail.length - 20} more`);
    }
    lines.push("");
  }

  lines.push("══════════════════════════════════════════════════════════");
  return lines.join("\n");
}

function progressBar(value: number, width: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  const filled = Math.round(clamped * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}
