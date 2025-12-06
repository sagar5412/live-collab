/**
 * Map Monaco editor language IDs to code execution languages
 * Supports: javascript, typescript, python, go, rust
 */

export type ExecutionLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "rust";

// Map Monaco language IDs to execution languages
const LANGUAGE_MAP: Record<string, ExecutionLanguage> = {
  // JavaScript variants
  javascript: "javascript",
  javascriptreact: "javascript",

  // TypeScript variants
  typescript: "typescript",
  typescriptreact: "typescript",

  // Python
  python: "python",

  // Go
  go: "go",

  // Rust
  rust: "rust",
};

// File extensions to execution language
const EXTENSION_MAP: Record<string, ExecutionLanguage> = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mts": "typescript",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
};

/**
 * Get execution language from Monaco language ID
 */
export function getExecutionLanguage(
  monacoLanguage: string
): ExecutionLanguage | null {
  return LANGUAGE_MAP[monacoLanguage.toLowerCase()] || null;
}

/**
 * Get execution language from file name
 */
export function getExecutionLanguageFromFile(
  fileName: string
): ExecutionLanguage | null {
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  return EXTENSION_MAP[ext] || null;
}

/**
 * Check if a file/language is executable
 */
export function isExecutable(monacoLanguage: string): boolean {
  return monacoLanguage.toLowerCase() in LANGUAGE_MAP;
}

/**
 * Get supported execution languages list
 */
export function getSupportedLanguages(): ExecutionLanguage[] {
  return ["javascript", "typescript", "python", "go", "rust"];
}
