import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `@jingerpie/dataview-core` is framework-neutral: it must not import
 * React, icons, styling helpers, URL-state libraries, or other dataview
 * packages.
 */
const CORE_PATHS = ["."];

const FORBIDDEN = [
  /from "react(-dom)?(\/[^"]*)?"/,
  /from "lucide-react"/,
  /from "(clsx|tailwind-merge|class-variance-authority)"/,
  /from "next(\/[^"]*)?"/,
  /from "nuqs(\/[^"]*)?"/,
  /from "@sparkyidea\/(?!dataview-core)[^"]*"/,
];

const SRC = join(import.meta.dirname, "..");

function listFiles(path: string): string[] {
  if (statSync(path).isFile()) {
    return [path];
  }
  return readdirSync(path)
    .filter((name) => name !== "__tests__")
    .flatMap((name) => listFiles(join(path, name)));
}

describe("core module boundaries", () => {
  const files = CORE_PATHS.flatMap((path) => listFiles(join(SRC, path)));

  it.each(
    files.map((file) => [relative(SRC, file), file])
  )("%s imports no UI dependencies", (_name, file) => {
    const source = readFileSync(file, "utf8");
    for (const pattern of FORBIDDEN) {
      expect(source).not.toMatch(pattern);
    }
  });
});
