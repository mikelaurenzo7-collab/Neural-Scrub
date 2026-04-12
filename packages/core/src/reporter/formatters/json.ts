import type { SentinelReport } from "../../types/index.js";

export function formatJSON(report: SentinelReport): string {
  return JSON.stringify(report, null, 2);
}
