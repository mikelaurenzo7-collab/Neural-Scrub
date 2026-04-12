import { Command } from "commander";
import { execSync } from "node:child_process";
import { doSetup } from "./setup.js";
import { installHook } from "./hook.js";

export function initCommand(): Command {
  return new Command("init")
    .description("Initialize Sentinel: create data directories + install git hook for current repo")
    .action(async () => {
      console.log("\n  Sentinel — Quick Init\n");

      // Step 1: Setup data dirs
      await doSetup();

      // Step 2: Install hook in current repo
      const repoPath = process.cwd();
      try {
        execSync("git rev-parse --git-dir", { cwd: repoPath, stdio: "ignore" });
        await installHook(repoPath);
      } catch {
        console.log("  ⚠  Not inside a git repo — skipping hook install.");
        console.log("     Run 'sentinel hook install <repo-path>' later.\n");
      }

      console.log("  ✓ Sentinel initialized. Run 'sentinel analyze .' to scan this repo.\n");
    });
}
