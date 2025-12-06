/**
 * Simple file concatenation for multi-file support
 * Transforms ES modules to work in iframe without bundler
 */

export interface VirtualFile {
  path: string;
  content: string;
}

export interface BundleResult {
  success: boolean;
  code?: string;
  css?: string;
  error?: string;
}

/**
 * Simple bundler that concatenates files and transforms imports
 * This is a lightweight alternative to esbuild for basic import support
 */
export async function bundleForPreview(
  files: VirtualFile[],
  _entryHint?: string
): Promise<BundleResult> {
  try {
    // Separate JS/TS files from CSS files
    const jsFiles = files.filter(
      (f) =>
        f.path.endsWith(".js") ||
        f.path.endsWith(".ts") ||
        f.path.endsWith(".jsx") ||
        f.path.endsWith(".tsx")
    );
    const cssFiles = files.filter((f) => f.path.endsWith(".css"));

    if (jsFiles.length === 0) {
      return { success: true, code: "", css: "" };
    }

    // Build a module map for resolving imports
    const moduleMap = new Map<string, string>();
    for (const file of jsFiles) {
      const name = file.path
        .replace(/^\//, "")
        .replace(/\.(js|ts|jsx|tsx)$/, "");
      moduleMap.set(name, file.content);
      moduleMap.set(file.path, file.content);
      moduleMap.set(file.path.replace(/^\//, ""), file.content);
    }

    // Transform each file to remove import/export and wrap in IIFE
    const transformedModules: string[] = [];
    const exports: Map<string, string[]> = new Map();

    for (const file of jsFiles) {
      let code = file.content;
      const moduleName = file.path
        .replace(/^\//, "")
        .replace(/\.(js|ts|jsx|tsx)$/, "")
        .replace(/[^a-zA-Z0-9]/g, "_");
      const moduleExports: string[] = [];

      // Extract named exports: export function foo() {} or export const foo = ...
      code = code.replace(
        /export\s+(function|const|let|var|class)\s+(\w+)/g,
        (_, type, name) => {
          moduleExports.push(name);
          return `${type} ${name}`;
        }
      );

      // Extract export { ... }
      code = code.replace(/export\s*\{([^}]+)\}/g, (_, names) => {
        const exportedNames = names
          .split(",")
          .map((n: string) => n.trim().split(" as ")[0].trim());
        moduleExports.push(...exportedNames);
        return "";
      });

      // Remove export default for now (complex to handle)
      code = code.replace(/export\s+default\s+/g, "const __default__ = ");

      // Transform imports: import { foo } from './bar'
      code = code.replace(
        /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g,
        (_, names, path) => {
          const importPath = path
            .replace(/^\.\//, "")
            .replace(/\.(js|ts)$/, "")
            .replace(/[^a-zA-Z0-9]/g, "_");
          const importedNames = names.split(",").map((n: string) => {
            const parts = n.trim().split(/\s+as\s+/);
            const originalName = parts[0].trim();
            const alias = parts[1]?.trim() || originalName;
            return `const ${alias} = __modules__.${importPath}.${originalName};`;
          });
          return importedNames.join("\n");
        }
      );

      // Transform: import foo from './bar'
      code = code.replace(
        /import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g,
        (_, name, path) => {
          const importPath = path
            .replace(/^\.\//, "")
            .replace(/\.(js|ts)$/, "")
            .replace(/[^a-zA-Z0-9]/g, "_");
          return `const ${name} = __modules__.${importPath}.__default__ || __modules__.${importPath};`;
        }
      );

      // Transform: import './bar' (side effects only)
      code = code.replace(/import\s*['"]([^'"]+)['"]\s*;?/g, "");

      exports.set(moduleName, moduleExports);

      // Wrap in module closure
      const exportObj =
        moduleExports.length > 0 ? `{ ${moduleExports.join(", ")} }` : "{}";

      transformedModules.push(`
// Module: ${file.path}
__modules__.${moduleName} = (function() {
  ${code}
  return ${exportObj};
})();
`);
    }

    // Combine all modules
    const bundledCode = `
// Module registry
const __modules__ = {};

${transformedModules.join("\n")}
`;

    // Combine CSS
    const bundledCss = cssFiles.map((f) => f.content).join("\n");

    return {
      success: true,
      code: bundledCode,
      css: bundledCss,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default { bundleForPreview };
