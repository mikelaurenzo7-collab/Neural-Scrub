import type { AIFeatures, DiffFile, FilenameSignal, InlineCommentSignal } from "../types/index.js";
import { parseAST } from "../parser/ast-parser.js";

const FILENAME_SIGNAL_MAP: Record<string, FilenameSignal> = {
  "types.ts": "types-file",
  "types.tsx": "types-file",
  "interfaces.ts": "interfaces-file",
  "interfaces.tsx": "interfaces-file",
  "README.md": "readme",
  "readme.md": "readme",
  ".env.example": "env-example",
  ".env.sample": "env-example",
  "utils.ts": "utils-file",
  "utils.js": "utils-file",
  "helpers.ts": "helpers-file",
  "helpers.js": "helpers-file",
  "constants.ts": "constants-file",
  "constants.js": "constants-file",
  "config.ts": "config-file",
  "config.js": "config-file",
  "index.ts": "index-barrel",
  "index.js": "index-barrel",
};

const INLINE_COMMENT_PATTERNS: { pattern: RegExp; signal: InlineCommentSignal }[] = [
  { pattern: /\/\/\s*Note:/i, signal: "note-comment" },
  { pattern: /\/\/\s*Important:/i, signal: "important-comment" },
  { pattern: /\/\/\s*TODO:/i, signal: "todo-comment" },
  { pattern: /\/\/\s*FIXME:/i, signal: "fixme-comment" },
  { pattern: /\/\/ ─{3,}|\/\/ ={3,}|\/\*\*\s*\n(\s*\*\s*.+\n){3,}\s*\*\//, signal: "explanation-block" },
];

export function extractFeatures(file: DiffFile): AIFeatures {
  const addedCode = file.hunks
    .flatMap((h) => h.lines)
    .filter((l) => l.type === "add")
    .map((l) => l.content)
    .join("\n");

  const filename = basename(file.newPath);
  const ast = parseAST(addedCode, file.newPath);
  const isNewFile = file.status === "added";

  // Detect filename-based signals
  const filenameSignals: FilenameSignal[] = [];
  const signal = FILENAME_SIGNAL_MAP[filename];
  if (signal && isNewFile) {
    filenameSignals.push(signal);
  }
  // Check for test files
  if (isNewFile && /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(filename)) {
    filenameSignals.push("test-file");
  }

  // Detect inline comment signals
  const inlineCommentSignals: InlineCommentSignal[] = [];
  for (const { pattern, signal } of INLINE_COMMENT_PATTERNS) {
    if (pattern.test(addedCode)) {
      inlineCommentSignals.push(signal);
    }
  }

  // Detect added packages (from package.json changes)
  const addedPackages: string[] = [];
  if (file.newPath.endsWith("package.json")) {
    const pkgMatches = addedCode.match(/"([^"]+)":\s*"[\^~]?\d/g) ?? [];
    for (const m of pkgMatches) {
      const name = m.match(/"([^"]+)"/)?.[1];
      if (name) addedPackages.push(name);
    }
  }

  // ─── Structural signals ─────────────────────────────────────
  const usesClassPattern = ast.classCount > 0;
  const usesInheritance = ast.classWithExtendsCount > 0;
  const usesDefaultExport = ast.exportDefaultCount > 0;
  const prefersLet = ast.letCount > ast.constCount;
  const usesLogicalOrDefaults = ast.logicalOrDefaultCount > 0 && ast.nullishCoalesceCount === 0;

  // Infrastructure files: Dockerfiles, CI/CD, compose, k8s manifests
  const infraExtensions = /\.(ya?ml|dockerfile)$/i;
  const infraNames = /^(dockerfile|docker-compose|makefile|jenkinsfile|\.gitlab-ci|\.github)/i;
  const lowerPath = file.newPath.toLowerCase();
  const isInfrastructureFile =
    infraExtensions.test(lowerPath) ||
    infraNames.test(basename(file.newPath)) ||
    lowerPath.includes(".github/workflows/") ||
    lowerPath.endsWith("dockerfile") ||
    lowerPath.includes("docker-compose");

  // Scattered edits: multiple small hunks (avg < 8 lines), typical of Copilot inline completions
  const totalHunkLines = file.hunks.reduce(
    (sum, h) => sum + h.lines.filter((l) => l.type !== "context").length,
    0,
  );
  const avgHunkSize = file.hunks.length > 0 ? totalHunkLines / file.hunks.length : 0;
  const isScatteredEdit = !isNewFile && file.hunks.length >= 2 && avgHunkSize < 8;

  // totalFilesInDiff is set to 1 here — the caller should override when analyzing a full diff
  const totalFilesInDiff = 1;

  return {
    file,
    ast,
    isNewFile,
    filenameSignals,
    inlineCommentSignals,
    addedPackages,
    usesClassPattern,
    usesInheritance,
    usesDefaultExport,
    prefersLet,
    usesLogicalOrDefaults,
    isInfrastructureFile,
    isScatteredEdit,
    avgHunkSize,
    totalFilesInDiff,
  };
}

function basename(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}
