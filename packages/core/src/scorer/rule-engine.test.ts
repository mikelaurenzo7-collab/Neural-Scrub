import { describe, it, expect } from "vitest";
import { parseDiff, buildReport } from "../index.js";

const CLAUDE_FIXTURE = `diff --git a/src/types.ts b/src/types.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/types.ts
@@ -0,0 +1,12 @@
+export interface User {
+  id: string;
+  name: string;
+  email: string;
+}
+
+export interface ApiResponse<T> {
+  data: T;
+  status: number;
+  message: string;
+}
+
diff --git a/src/helpers.ts b/src/helpers.ts
new file mode 100644
index 0000000..def5678
--- /dev/null
+++ b/src/helpers.ts
@@ -0,0 +1,20 @@
+/**
+ * Helper utilities
+ * Note: Used across the app
+ */
+
+// Important: validate all inputs
+export const validate = (input: string): boolean => {
+  if (!input) return false;
+  if (input.length > 255) return false;
+  return true;
+};
+
+export const format = (val: number): string => {
+  try {
+    return val.toFixed(2);
+  } catch {
+    return "0.00";
+  }
+};
+
`;

describe("scoring engine (via buildReport)", () => {
  it("identifies Claude patterns in a Claude-like diff", () => {
    const files = parseDiff(CLAUDE_FIXTURE);
    const report = buildReport(files, "/test/repo");

    expect(report.totalFiles).toBe(2);

    // Claude should be the dominant model for this fixture
    const dominant = report.summary.dominantModel;
    expect(dominant).not.toBeNull();
    expect(dominant?.modelId).toBe("claude");
  });

  it("detects unprompted changes", () => {
    const files = parseDiff(CLAUDE_FIXTURE);
    const report = buildReport(files, "/test/repo");

    // types.ts and helpers.ts should be flagged
    expect(report.summary.unpromptedChanges.length).toBeGreaterThan(0);
    const fileNames = report.summary.unpromptedChanges.map((c) => c.file);
    expect(fileNames).toContain("src/types.ts");
    expect(fileNames).toContain("src/helpers.ts");
  });

  it("produces a valid evidence trail", () => {
    const files = parseDiff(CLAUDE_FIXTURE);
    const report = buildReport(files, "/test/repo");

    expect(report.summary.evidenceTrail.length).toBeGreaterThan(0);
    for (const ev of report.summary.evidenceTrail) {
      expect(ev.patternId).toBeTruthy();
      expect(ev.file).toBeTruthy();
      expect(ev.snippet).toBeTruthy();
    }
  });

  it("includes generatedAt timestamp", () => {
    const files = parseDiff(CLAUDE_FIXTURE);
    const report = buildReport(files, "/test/repo");
    expect(report.generatedAt).toBeTruthy();
    // Should be valid ISO string
    expect(() => new Date(report.generatedAt)).not.toThrow();
  });
});
