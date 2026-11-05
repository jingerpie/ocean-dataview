import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Framework-neutral modules. These become `@sparkyidea/dataview-core`, so
 * they must not import React, icons, styling helpers, or UI components.
 */
const CORE_PATHS = [
  "types",
  "utils",
  "parsers",
  "validators",
  "lib/url-dsl",
  "lib/filter-preview.ts",
];

const FORBIDDEN = [
  /from "react(-dom)?(\/[^"]*)?"/,
  /from "lucide-react"/,
  /from "(clsx|tailwind-merge|class-variance-authority)"/,
  /from "next(\/[^"]*)?"/,
  /from "[^"]*\/components\/[^"]*"/,
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
