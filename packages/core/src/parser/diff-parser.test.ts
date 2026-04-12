import { describe, it, expect } from "vitest";
import { parseDiff } from "../parser/diff-parser.js";

const FIXTURE_DIFF = `diff --git a/src/utils.ts b/src/utils.ts
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
diff --git a/src/types.ts b/src/types.ts
new file mode 100644
index 0000000..def5678
--- /dev/null
+++ b/src/types.ts
@@ -0,0 +1,15 @@
+export interface User {
+  id: string;
+  name: string;
+  email: string;
+  createdAt: Date;
+}
+
+export interface ApiResponse<T> {
+  data: T;
+  status: number;
+  message: string;
+}
+
+export type UserRole = "admin" | "editor" | "viewer";
+export type SortOrder = "asc" | "desc";
diff --git a/src/app.ts b/src/app.ts
index aaa1111..bbb2222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,5 +1,12 @@
 import express from "express";
+import { User } from "./types.js";
+import { sanitize } from "./utils.js";
 
 const app = express();
 
-app.listen(3000);
+app.get("/user/:id", (req, res) => {
+  const id = sanitize(req.params.id);
+  // TODO: fetch user from database
+  res.json({ id });
+});
+
+app.listen(3000);
`;

describe("parseDiff", () => {
  it("parses multiple files from a unified diff", () => {
    const files = parseDiff(FIXTURE_DIFF);
    expect(files).toHaveLength(3);
  });

  it("detects new files correctly", () => {
    const files = parseDiff(FIXTURE_DIFF);
    const utils = files.find((f) => f.newPath === "src/utils.ts");
    const types = files.find((f) => f.newPath === "src/types.ts");
    const app = files.find((f) => f.newPath === "src/app.ts");

    expect(utils?.status).toBe("added");
    expect(types?.status).toBe("added");
    expect(app?.status).toBe("modified");
  });

  it("counts added and removed lines correctly", () => {
    const files = parseDiff(FIXTURE_DIFF);
    const utils = files.find((f) => f.newPath === "src/utils.ts")!;
    expect(utils.addedLines).toBe(25);
    expect(utils.removedLines).toBe(0);

    const app = files.find((f) => f.newPath === "src/app.ts")!;
    expect(app.addedLines).toBe(9);
    expect(app.removedLines).toBe(1);
  });

  it("parses hunk headers", () => {
    const files = parseDiff(FIXTURE_DIFF);
    const utils = files.find((f) => f.newPath === "src/utils.ts")!;
    expect(utils.hunks).toHaveLength(1);
    expect(utils.hunks[0]!.newStart).toBe(1);
    expect(utils.hunks[0]!.newLines).toBe(25);
  });

  it("returns empty array for empty input", () => {
    expect(parseDiff("")).toEqual([]);
    expect(parseDiff("\n\n")).toEqual([]);
  });

  it("parses renamed files", () => {
    const renameDiff = `diff --git a/old.ts b/new.ts
similarity index 95%
rename from old.ts
rename to new.ts
index aaa..bbb 100644
--- a/old.ts
+++ b/new.ts
@@ -1,3 +1,3 @@
 const x = 1;
-const y = 2;
+const y = 3;
 const z = 4;
`;
    const files = parseDiff(renameDiff);
    expect(files).toHaveLength(1);
    expect(files[0]!.status).toBe("renamed");
    expect(files[0]!.oldPath).toBe("old.ts");
    expect(files[0]!.newPath).toBe("new.ts");
  });
});
