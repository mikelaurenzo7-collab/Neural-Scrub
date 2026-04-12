import type { DiffFile, DiffHunk, DiffLine } from "../types/index.js";

type ParserState = "header" | "hunk-header" | "hunk-body";

export function parseDiff(raw: string): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = raw.split("\n");

  let state: ParserState = "header";
  let currentFile: Partial<DiffFile> | null = null;
  let currentHunk: DiffHunk | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // New file diff starts
    if (line.startsWith("diff --git ")) {
      // Flush previous file
      if (currentFile) {
        if (currentHunk) {
          currentFile.hunks!.push(currentHunk);
          currentHunk = null;
        }
        files.push(finalizeFile(currentFile));
      }

      const paths = parseGitDiffHeader(line);
      currentFile = {
        oldPath: paths.oldPath,
        newPath: paths.newPath,
        status: "modified",
        hunks: [],
        addedLines: 0,
        removedLines: 0,
      };
      state = "header";
      continue;
    }

    if (!currentFile) continue;

    // File metadata headers
    if (state === "header") {
      if (line.startsWith("new file mode")) {
        currentFile.status = "added";
        continue;
      }
      if (line.startsWith("deleted file mode")) {
        currentFile.status = "deleted";
        continue;
      }
      if (line.startsWith("rename from ")) {
        currentFile.status = "renamed";
        currentFile.oldPath = line.slice("rename from ".length);
        continue;
      }
      if (line.startsWith("rename to ")) {
        currentFile.newPath = line.slice("rename to ".length);
        continue;
      }
      if (line.startsWith("--- ")) {
        const path = line.slice(4);
        if (path !== "/dev/null") {
          currentFile.oldPath = path.startsWith("a/") ? path.slice(2) : path;
        }
        continue;
      }
      if (line.startsWith("+++ ")) {
        const path = line.slice(4);
        if (path !== "/dev/null") {
          currentFile.newPath = path.startsWith("b/") ? path.slice(2) : path;
        }
        continue;
      }
      if (line.startsWith("index ") || line.startsWith("similarity index")) {
        continue;
      }
    }

    // Hunk header
    if (line.startsWith("@@")) {
      if (currentHunk) {
        currentFile.hunks!.push(currentHunk);
      }
      const hunkMeta = parseHunkHeader(line);
      if (hunkMeta) {
        currentHunk = {
          ...hunkMeta,
          header: line,
          lines: [],
        };
        oldLineNum = hunkMeta.oldStart;
        newLineNum = hunkMeta.newStart;
        state = "hunk-body";
      }
      continue;
    }

    // Hunk body
    if (state === "hunk-body" && currentHunk) {
      const diffLine = parseDiffLine(line, oldLineNum, newLineNum);
      if (diffLine) {
        currentHunk.lines.push(diffLine);
        if (diffLine.type === "add") {
          newLineNum++;
          currentFile.addedLines!++;
        } else if (diffLine.type === "remove") {
          oldLineNum++;
          currentFile.removedLines!++;
        } else {
          oldLineNum++;
          newLineNum++;
        }
      }
    }
  }

  // Flush last file
  if (currentFile) {
    if (currentHunk) {
      currentFile.hunks!.push(currentHunk);
    }
    files.push(finalizeFile(currentFile));
  }

  return files;
}

function parseGitDiffHeader(line: string): { oldPath: string; newPath: string } {
  // "diff --git a/path/to/file b/path/to/file"
  const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
  if (match) {
    return { oldPath: match[1]!, newPath: match[2]! };
  }
  return { oldPath: "", newPath: "" };
}

function parseHunkHeader(
  line: string,
): { oldStart: number; oldLines: number; newStart: number; newLines: number } | null {
  const match = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
  if (!match) return null;
  return {
    oldStart: parseInt(match[1]!, 10),
    oldLines: parseInt(match[2] ?? "1", 10),
    newStart: parseInt(match[3]!, 10),
    newLines: parseInt(match[4] ?? "1", 10),
  };
}

function parseDiffLine(
  line: string,
  oldLineNum: number,
  newLineNum: number,
): DiffLine | null {
  if (line.startsWith("+")) {
    return { type: "add", content: line.slice(1), newLineNumber: newLineNum };
  }
  if (line.startsWith("-")) {
    return { type: "remove", content: line.slice(1), oldLineNumber: oldLineNum };
  }
  if (line.startsWith(" ") || line === "") {
    return {
      type: "context",
      content: line.startsWith(" ") ? line.slice(1) : line,
      oldLineNumber: oldLineNum,
      newLineNumber: newLineNum,
    };
  }
  // "\ No newline at end of file" or binary markers — skip
  return null;
}

function finalizeFile(partial: Partial<DiffFile>): DiffFile {
  return {
    oldPath: partial.oldPath ?? "",
    newPath: partial.newPath ?? "",
    status: partial.status ?? "modified",
    hunks: partial.hunks ?? [],
    addedLines: partial.addedLines ?? 0,
    removedLines: partial.removedLines ?? 0,
  };
}
