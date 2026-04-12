import { Command } from "commander";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { parseDiff, buildReport } from "@sentinel/core";

export function compareCommand(): Command {
  const cmd = new Command("compare").description("Compare AI model outputs side-by-side");

  cmd
    .command("create <task-name>")
    .description("Create comparison directories for a task")
    .action(async (taskName: string) => {
      const date = new Date().toISOString().split("T")[0]!;
      const baseDir = join(homedir(), "sentinel-data", "comparisons", `${date}-${taskName}`);
      const models = ["claude", "gpt", "gemini", "copilot", "cursor", "windsurf", "devin"];

      for (const model of models) {
        await mkdir(join(baseDir, model), { recursive: true });
      }

      console.log(`\n  ✓ Created comparison directories at:`);
      console.log(`    ${baseDir}/`);
      for (const model of models) {
        console.log(`      ${model}/`);
      }
      console.log(`\n  Drop each model's diff into its folder, then run:`);
      console.log(`    sentinel compare ${taskName}\n`);
    });

  cmd
    .command("run <task-name>")
    .description("Analyze and compare all models' diffs for a task")
    .action(async (taskName: string) => {
      const comparisonsDir = join(homedir(), "sentinel-data", "comparisons");
      const entries = await readdir(comparisonsDir);

      // Find the most recent directory matching the task name
      const matching = entries.filter((e) => e.endsWith(`-${taskName}`)).sort().reverse();
      if (matching.length === 0) {
        console.log(`\n  ✗ No comparison found for task "${taskName}".`);
        console.log(`    Run 'sentinel compare create ${taskName}' first.\n`);
        return;
      }

      const taskDir = join(comparisonsDir, matching[0]!);
      const models = await readdir(taskDir);

      console.log(`\n  Sentinel — Comparison: ${taskName}`);
      console.log(`  ${"─".repeat(50)}\n`);

      for (const model of models.sort()) {
        const modelDir = join(taskDir, model);
        const files = await readdir(modelDir);
        const diffFiles = files.filter((f) => f.endsWith(".diff"));

        if (diffFiles.length === 0) {
          console.log(`  ${model.toUpperCase().padEnd(12)} — no diffs found`);
          continue;
        }

        // Analyze all diffs for this model
        let allDiffText = "";
        for (const df of diffFiles) {
          allDiffText += await readFile(join(modelDir, df), "utf-8");
          allDiffText += "\n";
        }

        const parsed = parseDiff(allDiffText);
        const report = buildReport(parsed, model);

        const dominant = report.summary.dominantModel;
        const risk = report.summary.riskScore;
        const unprompted = report.summary.unpromptedChanges.length;

        console.log(
          `  ${model.toUpperCase().padEnd(12)} | ` +
            `Files: ${report.totalFiles.toString().padEnd(4)} | ` +
            `+${report.totalAddedLines}/-${report.totalRemovedLines}`.padEnd(14) +
            `| Risk: ${risk.padEnd(8)} | ` +
            `Unprompted: ${unprompted}` +
            (dominant ? ` | Signal: ${dominant.displayName} (${(dominant.confidence * 100).toFixed(0)}%)` : ""),
        );
      }
      console.log("");
    });

  return cmd;
}
