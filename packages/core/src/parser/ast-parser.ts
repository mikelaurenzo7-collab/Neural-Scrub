import type { ASTFeatures } from "../types/index.js";

const JS_TS_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".mts", ".cjs", ".cts"]);

export function parseAST(code: string, filename: string): ASTFeatures {
  const ext = getExtension(filename);
  if (JS_TS_EXTENSIONS.has(ext)) {
    return parseJsTsFeatures(code, ext === ".tsx" || ext === ".jsx");
  }
  return parseRegexFallback(code);
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

function parseJsTsFeatures(code: string, _isJsx: boolean): ASTFeatures {
  // Use Babel for JS/TS — dynamic import to handle optional dependency gracefully
  // For v1, use regex-based parsing that doesn't require Babel to be loaded synchronously.
  // Babel integration will be added when the module loads the first time.
  return parseRegexFallback(code);
}

/**
 * Regex-based feature extraction — works for any language.
 * Less precise than AST but covers all file types.
 */
function parseRegexFallback(code: string): ASTFeatures {
  const lines = code.split("\n");
  const totalLineCount = lines.length;

  // Functions
  const arrowFunctionCount = countMatches(code, /(?:const|let|var)\s+\w+\s*=\s*(?:\([^)]*\))[^=]*=>/g);
  const functionDeclarationCount = countMatches(code, /\bfunction\s+\w+/g);
  const functionExpressionCount = countMatches(code, /\bfunction\s*\(/g);
  const functionCount = arrowFunctionCount + functionDeclarationCount + functionExpressionCount;

  // Imports
  const importMatches = code.match(/(?:^|\n)\s*import\s+.+?from\s+['"]([^'"]+)['"]/g) ?? [];
  const requireMatches = code.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) ?? [];
  const importList = [
    ...importMatches.map((m) => {
      const match = m.match(/from\s+['"]([^'"]+)['"]/);
      return match?.[1] ?? "";
    }),
    ...requireMatches.map((m) => {
      const match = m.match(/['"]([^'"]+)['"]/);
      return match?.[1] ?? "";
    }),
  ].filter(Boolean);
  const importCount = importList.length;

  // Try/catch
  const tryCatchCount = countMatches(code, /\btry\s*\{/g);
  const tryCatchPerFunction = functionCount > 0 ? tryCatchCount / functionCount : 0;

  // Comments
  const singleLineComments = countMatches(code, /\/\/.*/g);
  const multiLineCommentBlocks = countMatches(code, /\/\*[\s\S]*?\*\//g);
  const commentLineCount = singleLineComments + multiLineCommentBlocks;
  const commentDensity = totalLineCount > 0 ? commentLineCount / totalLineCount : 0;

  // Variable declarations
  const constCount = countMatches(code, /\bconst\s+/g);
  const letCount = countMatches(code, /\blet\s+/g);
  const varCount = countMatches(code, /\bvar\s+/g);
  const constOnly = constCount > 0 && letCount === 0 && varCount === 0;

  // Guard clauses / early returns
  const earlyReturnCount = countMatches(code, /if\s*\([^)]*\)\s*(?:return|throw|continue|break)\b/g);
  const guardClauseCount = countMatches(
    code,
    /if\s*\(\s*!?\w[^)]*\)\s*\{\s*(?:return|throw)\b/g,
  );

  // TypeScript features
  const typeAnnotationCount = countMatches(code, /:\s*(?:string|number|boolean|void|any|unknown|never|null|undefined|\w+(?:<[^>]+>)?)\b/g);
  const interfaceCount = countMatches(code, /\binterface\s+\w+/g);
  const typeAliasCount = countMatches(code, /\btype\s+\w+\s*=/g);

  // JSDoc
  const jsdocCount = countMatches(code, /\/\*\*[\s\S]*?\*\//g);

  // ─── Deep behavioral signals ──────────────────────────────────
  const classCount = countMatches(code, /\bclass\s+\w+/g);
  const classWithExtendsCount = countMatches(code, /\bclass\s+\w+\s+extends\s+/g);
  const exportDefaultCount = countMatches(code, /\bexport\s+default\b/g);
  const exportNamedCount = countMatches(code, /\bexport\s+(?:const|function|class|interface|type|enum|async)\b/g);
  const asyncFunctionCount = countMatches(code, /\basync\s+(?:function|\w+\s*\(|(?:\([^)]*\))[^=]*=>)/g);
  const awaitCount = countMatches(code, /\bawait\s+/g);
  const promiseConstructCount = countMatches(code, /new\s+Promise\b/g);
  const callbackPatternCount = countMatches(code, /\(\s*(?:err|error|e)\s*(?:,|\))/g);
  const nullishCoalesceCount = countMatches(code, /\?\?/g);
  const logicalOrDefaultCount = countMatches(code, /\|\|\s*(?:['"`\d{[]|true|false|null|undefined)/g);
  const optionalChainCount = countMatches(code, /\?\./g);
  const templateLiteralCount = countMatches(code, /`[^`]*\$\{/g);
  const enumCount = countMatches(code, /\benum\s+\w+/g);
  const genericTypeCount = countMatches(code, /<[A-Z]\w*(?:\s*,\s*[A-Z]\w*)*>/g);
  const decoratorCount = countMatches(code, /@\w+/g);
  const returnTypeAnnotationCount = countMatches(code, /\)\s*:\s*(?:Promise<|void|string|number|boolean|Record|Array|\w+(?:<[^>]+>)?)/g);
  const parameterTypeCount = countMatches(code, /\w+\s*:\s*(?:string|number|boolean|Request|Response|NextFunction|\w+(?:<[^>]+>)?)\s*[,)]/g);
  const destructuringCount = countMatches(code, /(?:const|let|var)\s*\{[^}]+\}\s*=/g);
  const spreadOperatorCount = countMatches(code, /\.\.\.\w+/g);
  const ternaryCount = countMatches(code, /[^?]\?[^?.]/g);
  const nestedTernaryCount = countMatches(code, /\?[^:]+\?/g);
  const methodCount = countMatches(code, /^\s+(?:async\s+)?(?:get|set|static\s+)?\w+\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/gm);
  const privateFieldCount = countMatches(code, /\bprivate\s+\w+/g);
  const readonlyCount = countMatches(code, /\breadonly\s+/g);
  const errorClassCount = countMatches(code, /class\s+\w*Error\s+extends\s+Error/g);
  const consoleLogCount = countMatches(code, /console\.\w+\(/g);

  // Section divider comments: // --- , // === , // ─── etc.
  const sectionCommentCount = countMatches(code, /\/\/\s*[-─═=]{3,}/g);

  // Empty line ratio
  const emptyLines = lines.filter((l) => l.trim() === "").length;
  const emptyLineRatio = totalLineCount > 0 ? emptyLines / totalLineCount : 0;

  // Average code line length (non-empty, non-comment)
  const codeLines = lines.filter((l) => l.trim() !== "" && !l.trim().startsWith("//") && !l.trim().startsWith("*"));
  const avgLineLengthCode = codeLines.length > 0
    ? codeLines.reduce((sum, l) => sum + l.length, 0) / codeLines.length
    : 0;
  const maxLineLength = lines.reduce((max, l) => Math.max(max, l.length), 0);

  return {
    functionCount,
    arrowFunctionCount,
    functionDeclarationCount,
    importCount,
    importList,
    tryCatchCount,
    tryCatchPerFunction,
    commentLineCount,
    totalLineCount,
    commentDensity,
    constCount,
    letCount,
    varCount,
    constOnly,
    guardClauseCount,
    earlyReturnCount,
    typeAnnotationCount,
    interfaceCount,
    typeAliasCount,
    jsdocCount,
    classCount,
    classWithExtendsCount,
    exportDefaultCount,
    exportNamedCount,
    asyncFunctionCount,
    awaitCount,
    promiseConstructCount,
    callbackPatternCount,
    nullishCoalesceCount,
    logicalOrDefaultCount,
    optionalChainCount,
    templateLiteralCount,
    enumCount,
    genericTypeCount,
    decoratorCount,
    returnTypeAnnotationCount,
    parameterTypeCount,
    destructuringCount,
    spreadOperatorCount,
    ternaryCount,
    nestedTernaryCount,
    methodCount,
    privateFieldCount,
    readonlyCount,
    errorClassCount,
    consoleLogCount,
    sectionCommentCount,
    emptyLineRatio,
    avgLineLengthCode,
    maxLineLength,
  };
}

function countMatches(text: string, regex: RegExp): number {
  return (text.match(regex) ?? []).length;
}

export { parseRegexFallback as _parseRegexFallback };
