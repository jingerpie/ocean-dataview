/**
 * Pack the headless packages and verify them in clean consumer projects.
 *
 * Each fixture in fixtures/ is copied to a temporary directory, gets the
 * packed tarballs plus its third-party dependencies installed, and runs its
 * `verify` script. Nothing resolves through workspace links or source paths.
 *
 * Usage: bun scripts/verify-packages.ts [fixture...]
 */
import { $ } from "bun";
import {
  makeWorkDir,
  packPackages,
  prepareFixture,
  typecheck,
} from "./lib/fixtures";

const FIXTURE_DEPS: Record<string, string[]> = {
  server: [
    "chrono-node",
    "date-fns",
    "drizzle-orm",
    "nuqs",
    "react",
    "zod",
    "typescript",
    "@types/bun",
    "@types/react",
  ],
  "react-vite": [
    "@tanstack/react-query",
    "chrono-node",
    "date-fns",
    "react",
    "react-dom",
    "zod",
    "typescript",
    "vite",
    "@types/bun",
    "@types/react",
    "@types/react-dom",
  ],
  "react-next": [
    "@tanstack/react-query",
    "chrono-node",
    "date-fns",
    "next",
    "nuqs",
    "react",
    "react-dom",
    "zod",
    "typescript",
    "@types/node",
    "@types/react",
    "@types/react-dom",
  ],
};

const only = process.argv.slice(2);
const fixtures = Object.keys(FIXTURE_DEPS).filter(
  (name) => only.length === 0 || only.includes(name)
);

const work = makeWorkDir("dataview-fixtures-");
const tarballs = await packPackages(work);

for (const name of fixtures) {
  const dir = await prepareFixture(
    name,
    work,
    tarballs,
    FIXTURE_DEPS[name] ?? []
  );
  await typecheck(dir);
  await $`bun run verify`.cwd(dir);
}

console.log(`\nAll fixtures passed: ${fixtures.join(", ")}`);
