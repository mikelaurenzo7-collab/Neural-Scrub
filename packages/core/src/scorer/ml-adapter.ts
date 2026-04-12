import { execFile } from "node:child_process";
import { access, constants } from "node:fs/promises";
import { resolve } from "node:path";
import type { AIFeatures, MLAdapter, MLPrediction, ModelId } from "../types/index.js";

const ML_PREDICT_SCRIPT = "ml/predict.py";

export function createMLAdapter(repoRoot: string): MLAdapter {
  const scriptPath = resolve(repoRoot, ML_PREDICT_SCRIPT);

  return {
    async isAvailable(): Promise<boolean> {
      try {
        await access(scriptPath, constants.R_OK);
        // Check if python3 is available
        return new Promise((resolve) => {
          execFile("python3", ["--version"], (error) => {
            resolve(!error);
          });
        });
      } catch {
        return false;
      }
    },

    async predict(features: AIFeatures): Promise<MLPrediction | null> {
      try {
        const available = await this.isAvailable();
        if (!available) return null;

        const input = JSON.stringify({
          functionCount: features.ast.functionCount,
          arrowFunctionCount: features.ast.arrowFunctionCount,
          functionDeclarationCount: features.ast.functionDeclarationCount,
          importCount: features.ast.importCount,
          tryCatchCount: features.ast.tryCatchCount,
          tryCatchPerFunction: features.ast.tryCatchPerFunction,
          commentDensity: features.ast.commentDensity,
          constCount: features.ast.constCount,
          letCount: features.ast.letCount,
          varCount: features.ast.varCount,
          constOnly: features.ast.constOnly ? 1 : 0,
          guardClauseCount: features.ast.guardClauseCount,
          earlyReturnCount: features.ast.earlyReturnCount,
          typeAnnotationCount: features.ast.typeAnnotationCount,
          interfaceCount: features.ast.interfaceCount,
          typeAliasCount: features.ast.typeAliasCount,
          jsdocCount: features.ast.jsdocCount,
          isNewFile: features.isNewFile ? 1 : 0,
          addedLines: features.file.addedLines,
          removedLines: features.file.removedLines,
        });

        return new Promise((resolve) => {
          const proc = execFile(
            "python3",
            [scriptPath],
            { timeout: 10000 },
            (error, stdout) => {
              if (error) {
                resolve(null);
                return;
              }
              try {
                const result = JSON.parse(stdout) as {
                  model: string;
                  confidence: number;
                  feature_importance: Record<string, number>;
                };
                resolve({
                  modelId: result.model as ModelId,
                  confidence: result.confidence,
                  featureImportance: result.feature_importance,
                });
              } catch {
                resolve(null);
              }
            },
          );
          proc.stdin?.write(input);
          proc.stdin?.end();
        });
      } catch {
        return null;
      }
    },
  };
}
