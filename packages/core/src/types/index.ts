// ─── Diff Parsing ────────────────────────────────────────────────

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: DiffLine[];
}

export interface DiffLine {
  type: "add" | "remove" | "context";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  status: "added" | "modified" | "deleted" | "renamed";
  hunks: DiffHunk[];
  addedLines: number;
  removedLines: number;
}

// ─── AST / Feature Extraction ────────────────────────────────────

export interface ASTFeatures {
  functionCount: number;
  arrowFunctionCount: number;
  functionDeclarationCount: number;
  importCount: number;
  importList: string[];
  tryCatchCount: number;
  tryCatchPerFunction: number;
  commentLineCount: number;
  totalLineCount: number;
  commentDensity: number;
  constCount: number;
  letCount: number;
  varCount: number;
  constOnly: boolean;
  guardClauseCount: number;
  earlyReturnCount: number;
  typeAnnotationCount: number;
  interfaceCount: number;
  typeAliasCount: number;
  jsdocCount: number;
  // ─── Deep behavioral signals (v1.1) ──────────────────────────
  classCount: number;
  classWithExtendsCount: number;
  exportDefaultCount: number;
  exportNamedCount: number;
  asyncFunctionCount: number;
  awaitCount: number;
  promiseConstructCount: number;
  callbackPatternCount: number;
  nullishCoalesceCount: number;
  logicalOrDefaultCount: number;
  optionalChainCount: number;
  templateLiteralCount: number;
  enumCount: number;
  genericTypeCount: number;
  decoratorCount: number;
  returnTypeAnnotationCount: number;
  parameterTypeCount: number;
  destructuringCount: number;
  spreadOperatorCount: number;
  ternaryCount: number;
  nestedTernaryCount: number;
  methodCount: number;
  privateFieldCount: number;
  readonlyCount: number;
  errorClassCount: number;
  consoleLogCount: number;
  sectionCommentCount: number;
  emptyLineRatio: number;
  avgLineLengthCode: number;
  maxLineLength: number;
}

export interface AIFeatures {
  file: DiffFile;
  ast: ASTFeatures;
  /** File was created (not modified) */
  isNewFile: boolean;
  /** Filename patterns that suggest unprompted creation */
  filenameSignals: FilenameSignal[];
  /** Inline comment patterns found */
  inlineCommentSignals: InlineCommentSignal[];
  /** NPM packages added beyond what was likely requested */
  addedPackages: string[];
  // ─── Structural signals (v1.1) ───────────────────────────────
  /** Uses class-based architecture (OOP) vs functional */
  usesClassPattern: boolean;
  /** Uses EventEmitter / inheritance chains */
  usesInheritance: boolean;
  /** Uses export default vs named exports */
  usesDefaultExport: boolean;
  /** Prefers let over const for variable declarations */
  prefersLet: boolean;
  /** Uses || for defaults instead of ?? */
  usesLogicalOrDefaults: boolean;
  /** File seems auto-generated / scaffolded */
  isInfrastructureFile: boolean;
  /** Scattered small edits across multiple hunks */
  isScatteredEdit: boolean;
  /** Average hunk size */
  avgHunkSize: number;
  /** Number of files in this diff (set during multi-file analysis) */
  totalFilesInDiff: number;
}

export type FilenameSignal =
  | "types-file"
  | "interfaces-file"
  | "readme"
  | "env-example"
  | "utils-file"
  | "helpers-file"
  | "constants-file"
  | "config-file"
  | "test-file"
  | "index-barrel";

export type InlineCommentSignal =
  | "note-comment"
  | "important-comment"
  | "todo-comment"
  | "fixme-comment"
  | "explanation-block";

// ─── Fingerprint Patterns ────────────────────────────────────────

export type ModelId = "claude" | "gpt" | "gemini" | "copilot" | "cursor" | "windsurf" | "devin";

export interface PatternMatch {
  patternId: string;
  signal: string;
  score: number;
  weight: number;
  evidence: string;
}

export interface FingerprintPattern {
  id: string;
  name: string;
  description: string;
  match(features: AIFeatures): PatternMatch | null;
}

// ─── Scoring ─────────────────────────────────────────────────────

export interface SentinelScore {
  modelId: ModelId;
  displayName: string;
  confidence: number;
  weightedScore: number;
  matches: PatternMatch[];
}

export type RiskLevel = "low" | "medium" | "high";

export interface UnpromptedChange {
  file: string;
  description: string;
  risk: RiskLevel;
  evidence: string;
}

export interface Evidence {
  patternId: string;
  file: string;
  line?: number;
  snippet: string;
  explanation: string;
}

// ─── Report ──────────────────────────────────────────────────────

export interface FileAnalysis {
  file: DiffFile;
  features: AIFeatures;
  scores: SentinelScore[];
  topModel: SentinelScore | null;
  unpromptedChanges: UnpromptedChange[];
}

export interface SentinelReport {
  generatedAt: string;
  repoPath: string;
  commitRange?: string;
  totalFiles: number;
  totalAddedLines: number;
  totalRemovedLines: number;
  files: FileAnalysis[];
  summary: ReportSummary;
}

export interface ReportSummary {
  dominantModel: SentinelScore | null;
  modelBreakdown: SentinelScore[];
  unpromptedChanges: UnpromptedChange[];
  riskScore: RiskLevel;
  evidenceTrail: Evidence[];
}

// ─── ML Adapter ──────────────────────────────────────────────────

export interface MLPrediction {
  modelId: ModelId;
  confidence: number;
  featureImportance: Record<string, number>;
}

export interface MLAdapter {
  isAvailable(): Promise<boolean>;
  predict(features: AIFeatures): Promise<MLPrediction | null>;
}

// ─── Config ──────────────────────────────────────────────────────

export interface SentinelConfig {
  dataDir: string;
  patterns: FingerprintPattern[];
  mlEnabled: boolean;
  outputFormat: OutputFormat;
}

export type OutputFormat = "text" | "json" | "markdown";
