#!/usr/bin/env node
import { Command } from "commander";
import { setupCommand } from "./commands/setup.js";
import { hookCommand } from "./commands/hook.js";
import { analyzeCommand } from "./commands/analyze.js";
import { compareCommand } from "./commands/compare.js";
import { logCommand } from "./commands/log.js";
import { initCommand } from "./commands/init.js";
import { reportCommand } from "./commands/report.js";
import { exportDataCommand } from "./commands/export.js";

const program = new Command();

program
  .name("sentinel")
  .description("AI Model Fingerprint Analyzer — identify who wrote what in your codebase")
  .version("0.1.0");

program.addCommand(initCommand());
program.addCommand(setupCommand());
program.addCommand(hookCommand());
program.addCommand(analyzeCommand());
program.addCommand(compareCommand());
program.addCommand(logCommand());
program.addCommand(reportCommand());
program.addCommand(exportDataCommand());

// v2 teaser
program
  .command("watch")
  .description("[v2] Real-time monitoring during active coding sessions — coming soon")
  .action(() => {
    console.log(
      "\n  sentinel watch is planned for v2.\n  It will monitor your editor sessions in real-time and flag AI-generated changes as they happen.\n  Star the repo to follow progress: https://github.com/mikelaurenzo7-collab/Neural-Scrub\n",
    );
  });

program.parse();
