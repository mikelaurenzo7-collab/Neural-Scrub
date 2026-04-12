import { Command } from "commander";
import { renderReport } from "../lib/reporting.js";
import type { OutputFormat } from "@sentinel/core";

export function analyzeCommand(): Command {
  return new Command("analyze")
    .description("Analyze git history for AI model fingerprints")
    .argument("[repo-path]", "Path to git repository", ".")
    .option("--diff <file>", "Analyze a single saved diff file")
    .option("--since <range>", "Filter commits by time range (e.g., 7d, 30d, 2024-01-01)")
    .option("--format <format>", "Output format: text, json, markdown", "text")
    .action(async (repoPath: string, options: { diff?: string; since?: string; format?: string }) => {
      const format = (options.format ?? "text") as OutputFormat;
      try {
        const output = await renderReport({
          repoPath,
          diff: options.diff,
          since: options.since,
          format,
        });
        console.log(output);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown analysis failure";
        console.error(`\n  ${message}\n`);
      }
    });
}
