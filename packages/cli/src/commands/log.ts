import { Command } from "commander";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { homedir } from "node:os";

export function logCommand(): Command {
  const cmd = new Command("log").description("Terminal session recording");

  cmd
    .command("start")
    .description("Start recording terminal session to ~/sentinel-data/terminal-logs/")
    .action(() => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const logPath = join(homedir(), "sentinel-data", "terminal-logs", `session-${timestamp}.log`);

      console.log(`\n  Recording terminal session to: ${logPath}`);
      console.log("  Type 'exit' to stop recording.\n");

      try {
        execSync(`script -q "${logPath}"`, { stdio: "inherit" });
      } catch {
        // script exits with non-zero when session ends
        console.log(`\n  ✓ Session saved to ${logPath}\n`);
      }
    });

  return cmd;
}
