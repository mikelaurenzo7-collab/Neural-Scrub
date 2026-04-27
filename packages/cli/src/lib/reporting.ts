import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import { dirname, resolve } from "node:path";
import {
  buildReport,
  formatJSON,
  formatMarkdown,
  formatText,
  parseDiff,
} from "@sentinel/core";
import type { OutputFormat, SentinelReport } from "@sentinel/core";

export interface AnalyzeOptions {
  diff?: string;
  since?: string;
}

export interface RenderOptions extends AnalyzeOptions {
  repoPath: string;
  format?: OutputFormat;
}

export async function generateReport(options: AnalyzeOptions & { repoPath: string }): Promise<SentinelReport> {
  let rawDiff: string;

  if (options.diff) {
    const diffPath = resolve(options.diff);
    rawDiff = await readFile(diffPath, "utf-8");
  } else {
    rawDiff = execFileSync("git", buildGitLogArgs(options.repoPath, options.since), {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    });
  }

  if (!rawDiff.trim()) {
    throw new Error("No diffs found to analyze.");
  }

  const files = parseDiff(rawDiff);
  return buildReport(files, options.repoPath, options.since);
}

export async function renderReport(options: RenderOptions): Promise<string> {
  const report = await generateReport(options);
  const format = options.format ?? "text";

  switch (format) {
    case "json":
      return formatJSON(report);
    case "markdown":
      return formatMarkdown(report);
    default:
      return formatText(report);
  }
}

export async function exportReportFiles(
  report: SentinelReport,
  outDir?: string,
): Promise<{ dir: string; markdownPath: string; jsonPath: string }> {
  const base = outDir ? resolve(expandHome(outDir)) : resolve(os.homedir(), "sentinel-data", "reports");
  await mkdir(base, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const markdownPath = resolve(base, `sentinel-report-${timestamp}.md`);
  const jsonPath = resolve(base, `sentinel-report-${timestamp}.json`);

  await writeFile(markdownPath, formatMarkdown(report), "utf-8");
  await writeFile(jsonPath, formatJSON(report), "utf-8");

  return { dir: dirname(markdownPath), markdownPath, jsonPath };
}

export function parseSince(since: string): string {
  const match = since.match(/^(\d+)([dwmy])$/);
  if (match) {
    const num = match[1] ?? "1";
    const unitMap: Record<string, string> = {
      d: "days",
      w: "weeks",
      m: "months",
      y: "years",
    };
    const unitKey = match[2] ?? "d";
    const unit = unitMap[unitKey] ?? "days";
    return `--since=${num} ${unit} ago`;
  }
  return `--since=${since}`;
}

export function buildGitLogArgs(repoPath: string, since?: string): string[] {
  const args = ["-C", resolve(repoPath), "log"];
  if (since) {
    args.push(parseSince(since));
  }
  args.push("-p", "--no-color");
  return args;
}

function expandHome(inputPath: string): string {
  if (inputPath === "~") {
    return os.homedir();
  }
  if (inputPath.startsWith("~/")) {
    return resolve(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}
