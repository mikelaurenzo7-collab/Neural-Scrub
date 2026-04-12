import { Command } from "commander";
import { writeFile, unlink, chmod } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const HOOK_MARKER = "# SENTINEL AUTO-HOOK";

const HOOK_SCRIPT = `#!/bin/sh
${HOOK_MARKER}
# Auto-saves diff + stats to ~/sentinel-data/diffs/ on each commit
SENTINEL_DIR="$HOME/sentinel-data/diffs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
REPO_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null || echo "unknown")")
DIFF_FILE="$SENTINEL_DIR/\${TIMESTAMP}_\${REPO_NAME}_\${BRANCH}.diff"
STATS_FILE="$SENTINEL_DIR/\${TIMESTAMP}_\${REPO_NAME}_\${BRANCH}.stats"

mkdir -p "$SENTINEL_DIR"

# Save the staged diff
git diff --cached > "$DIFF_FILE"

# Save stats
echo "timestamp: $TIMESTAMP" > "$STATS_FILE"
echo "repo: $REPO_NAME" >> "$STATS_FILE"
echo "branch: $BRANCH" >> "$STATS_FILE"
echo "files_changed: $(git diff --cached --numstat | wc -l | tr -d ' ')" >> "$STATS_FILE"
echo "insertions: $(git diff --cached --shortstat | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+')" >> "$STATS_FILE"
echo "deletions: $(git diff --cached --shortstat | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+')" >> "$STATS_FILE"
`;

export function hookCommand(): Command {
  const cmd = new Command("hook").description("Manage git pre-commit hooks");

  cmd
    .command("install [repo-path]")
    .description("Install pre-commit hook that auto-saves diffs to ~/sentinel-data/")
    .action(async (repoPath?: string) => {
      const target = repoPath ?? process.cwd();
      await installHook(target);
    });

  cmd
    .command("remove [repo-path]")
    .description("Remove Sentinel pre-commit hook")
    .action(async (repoPath?: string) => {
      const target = repoPath ?? process.cwd();
      await removeHook(target);
    });

  return cmd;
}

export async function installHook(repoPath: string): Promise<void> {
  const hookPath = join(repoPath, ".git", "hooks", "pre-commit");

  if (!existsSync(join(repoPath, ".git"))) {
    console.log(`  ✗ No .git directory found at ${repoPath}`);
    return;
  }

  if (existsSync(hookPath)) {
    const { readFile } = await import("node:fs/promises");
    const existing = await readFile(hookPath, "utf-8");
    if (existing.includes(HOOK_MARKER)) {
      console.log("  ⚠  Sentinel hook already installed.");
      return;
    }
    // Append to existing hook
    await writeFile(hookPath, existing + "\n" + HOOK_SCRIPT);
    console.log(`  ✓ Appended Sentinel hook to existing pre-commit at ${hookPath}`);
  } else {
    await writeFile(hookPath, HOOK_SCRIPT);
    console.log(`  ✓ Installed Sentinel pre-commit hook at ${hookPath}`);
  }

  await chmod(hookPath, 0o755);
}

async function removeHook(repoPath: string): Promise<void> {
  const hookPath = join(repoPath, ".git", "hooks", "pre-commit");

  if (!existsSync(hookPath)) {
    console.log("  ⚠  No pre-commit hook found.");
    return;
  }

  const { readFile } = await import("node:fs/promises");
  const content = await readFile(hookPath, "utf-8");

  if (!content.includes(HOOK_MARKER)) {
    console.log("  ⚠  Pre-commit hook exists but was not installed by Sentinel.");
    return;
  }

  // If the hook is ONLY the sentinel hook, remove the file
  const nonSentinelLines = content
    .split("\n")
    .filter((line) => {
      // Keep lines that aren't part of our hook block
      return !line.startsWith(HOOK_MARKER) && !line.includes("SENTINEL_DIR") && !line.includes("sentinel-data");
    })
    .join("\n")
    .trim();

  if (nonSentinelLines === "" || nonSentinelLines === "#!/bin/sh") {
    await unlink(hookPath);
    console.log(`  ✓ Removed Sentinel pre-commit hook from ${hookPath}`);
  } else {
    await writeFile(hookPath, nonSentinelLines + "\n");
    await chmod(hookPath, 0o755);
    console.log(`  ✓ Removed Sentinel portion from pre-commit hook (other hooks preserved)`);
  }
}
