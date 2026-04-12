import { Command } from "commander";
import { renderReport } from "../lib/reporting.js";

export function reportCommand(): Command {
  return new Command("report")
    .description("Generate a polished Markdown AI attribution report")
    .argument("[repo-path]", "Path to git repository", ".")
    .option("--diff <file>", "Generate report from a saved diff file")
    .option("--since <range>", "Filter commits by time range (e.g., 7d, 30d, 2024-01-01)")
    .action(async (repoPath: string, options: { diff?: string; since?: string }) => {
      try {
        const markdown = await renderReport({
          repoPath,
          diff: options.diff,
          since: options.since,
          format: "markdown",
        });
        console.log(markdown);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown report failure";
        console.error(`\n  ${message}\n`);
      }
    });
}
