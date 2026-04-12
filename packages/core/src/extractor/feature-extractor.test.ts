import { describe, it, expect } from "vitest";
import { parseDiff } from "../parser/diff-parser.js";
import { extractFeatures } from "./feature-extractor.js";

const CLAUDE_LIKE_DIFF = `diff --git a/src/utils.ts b/src/utils.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/utils.ts
@@ -0,0 +1,25 @@
+/**
+ * Utility functions for the application.
+ * Note: These helpers are used throughout the codebase.
+ */
+
+export const formatDate = (date: Date): string => {
+  return date.toISOString().split("T")[0];
+};
+
+export const slugify = (text: string): string => {
+  return text
+    .toLowerCase()
+    .replace(/[^a-z0-9]+/g, "-")
+    .replace(/(^-|-$)/g, "");
+};
+
+// Important: This function validates user input
+export const sanitize = (input: string): string => {
+  try {
+    if (!input) return "";
+    return input.replace(/[<>&"']/g, "");
+  } catch (error) {
+    throw new Error("Sanitization failed");
+  }
+};
`;

describe("extractFeatures", () => {
  it("detects new file status", () => {
    const files = parseDiff(CLAUDE_LIKE_DIFF);
    const features = extractFeatures(files[0]!);
    expect(features.isNewFile).toBe(true);
  });

  it("detects utils-file filename signal", () => {
    const files = parseDiff(CLAUDE_LIKE_DIFF);
    const features = extractFeatures(files[0]!);
    expect(features.filenameSignals).toContain("utils-file");
  });

  it("detects inline comment signals", () => {
    const files = parseDiff(CLAUDE_LIKE_DIFF);
    const features = extractFeatures(files[0]!);
    expect(features.inlineCommentSignals).toContain("important-comment");
  });

  it("counts const-only usage", () => {
    const files = parseDiff(CLAUDE_LIKE_DIFF);
    const features = extractFeatures(files[0]!);
    expect(features.ast.constOnly).toBe(true);
    expect(features.ast.constCount).toBeGreaterThan(0);
  });

  it("detects try/catch", () => {
    const files = parseDiff(CLAUDE_LIKE_DIFF);
    const features = extractFeatures(files[0]!);
    expect(features.ast.tryCatchCount).toBe(1);
  });

  it("detects arrow functions", () => {
    const files = parseDiff(CLAUDE_LIKE_DIFF);
    const features = extractFeatures(files[0]!);
    expect(features.ast.arrowFunctionCount).toBeGreaterThanOrEqual(3);
  });
});
