import { Command } from "commander";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const DATA_DIRS = [
  "diffs",
  "screenshots",
  "reasoning-traces",
  "terminal-logs",
  "session-notes",
  "comparisons",
];

export function setupCommand(): Command {
  return new Command("setup")
    .description("Create ~/sentinel-data/ directories for data collection")
    .action(async () => {
      console.log("\n  Sentinel — Setup\n");
      await doSetup();
      console.log("  ✓ All directories ready.\n");
    });
}

export async function doSetup(): Promise<void> {
  const baseDir = join(homedir(), "sentinel-data");

  for (const dir of DATA_DIRS) {
    const fullPath = join(baseDir, dir);
    await mkdir(fullPath, { recursive: true });
    console.log(`  ✓ ${fullPath}`);
  }
}
