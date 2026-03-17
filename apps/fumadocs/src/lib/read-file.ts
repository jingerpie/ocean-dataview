import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Gets the monorepo root directory, handling both:
 * - Running from monorepo root (bun run dev)
 * - Running from apps/fumadocs (bun run --filter fumadocs dev)
 */
function getMonorepoRoot(): string {
  const cwd = process.cwd();
  if (cwd.endsWith("apps/fumadocs") || cwd.includes("apps/fumadocs/")) {
    return path.join(cwd, "..", "..");
  }
  return cwd;
}

/**
 * Reads a file from the monorepo root.
 * @param src - Path relative to monorepo root (e.g., "apps/fumadocs/src/examples/demo.tsx")
 * @returns File contents as string, or empty string if file not found
 */
export async function readFileFromRoot(src: string): Promise<string> {
  const root = getMonorepoRoot();
  const filePath = path.join(root, src);

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    console.error(`Failed to read source file: ${filePath}`, error);
    return "";
  }
}

/**
 * Gets the language identifier for syntax highlighting based on file extension.
 */
export function getLanguageFromPath(filePath: string): string {
  const ext = path.extname(filePath).slice(1);
  if (ext === "ts" || ext === "tsx") {
    return "tsx";
  }
  if (ext === "js" || ext === "jsx") {
    return "jsx";
  }
  return ext || "text";
}
