import type { FingerprintPattern } from "../../types/index.js";
import { claudePatterns } from "./claude.js";
import { gptPatterns } from "./gpt.js";
import { geminiPatterns } from "./gemini.js";
import { copilotPatterns } from "./copilot.js";
import { cursorPatterns } from "./cursor.js";
import { windsurfPatterns } from "./windsurf.js";
import { devinPatterns } from "./devin.js";

export const allPatterns: FingerprintPattern[] = [
  ...claudePatterns,
  ...gptPatterns,
  ...geminiPatterns,
  ...copilotPatterns,
  ...cursorPatterns,
  ...windsurfPatterns,
  ...devinPatterns,
];

export {
  claudePatterns,
  gptPatterns,
  geminiPatterns,
  copilotPatterns,
  cursorPatterns,
  windsurfPatterns,
  devinPatterns,
};
