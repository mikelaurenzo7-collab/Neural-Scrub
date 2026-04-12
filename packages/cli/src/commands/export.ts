import { Command } from "commander";
import { exportReportFiles, generateReport } from "../lib/reporting.js";

export function exportDataCommand(): Command {
  return new Command("export")
    .description("Export analysis report files to disk (Markdown + JSON)")
    .argument("[repo-path]", "Path to git repository", ".")
    .option("--diff <file>", "Export from a saved diff file")
    .option("--since <range>", "Filter commits by time range (e.g., 7d, 30d, 2024-01-01)")
    .option("--out <dir>", "Output directory (default: ~/sentinel-data/reports)")
    .action(async (repoPath: string, options: { diff?: string; since?: string; out?: string }) => {
      try {
        const report = await generateReport({
          repoPath,
          diff: options.diff,
          since: options.since,
        });

        const exported = await exportReportFiles(report, options.out);
        console.log("\n  Export complete");
        console.log(`  Directory: ${exported.dir}`);
        console.log(`  Markdown:  ${exported.markdownPath}`);
        console.log(`  JSON:      ${exported.jsonPath}\n`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown export failure";
        console.error(`\n  ${message}\n`);
      }
    });
}
