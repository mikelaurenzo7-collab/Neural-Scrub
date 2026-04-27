import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { buildGitLogArgs, parseSince } from "./reporting.js";

describe("reporting git arguments", () => {
  it("formats shorthand since ranges as a single git argument", () => {
    expect(parseSince("7d")).toBe("--since=7 days ago");
    expect(parseSince("2w")).toBe("--since=2 weeks ago");
  });

  it("passes explicit since values without shell quoting", () => {
    expect(parseSince("2024-01-01")).toBe("--since=2024-01-01");
  });

  it("builds git log arguments without concatenating a shell command", () => {
    const repoPath = '/tmp/repo with spaces/"quoted"';
    const args = buildGitLogArgs(repoPath, "30d");

    expect(args).toEqual([
      "-C",
      resolve(repoPath),
      "log",
      "--since=30 days ago",
      "-p",
      "--no-color",
    ]);
  });

  it("builds git log arguments without a since filter", () => {
    const repoPath = "/tmp/repo";

    expect(buildGitLogArgs(repoPath)).toEqual([
      "-C",
      resolve(repoPath),
      "log",
      "-p",
      "--no-color",
    ]);
  });
});
