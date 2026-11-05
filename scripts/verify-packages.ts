/**
 * Pack the headless packages and verify them in clean consumer projects.
 *
 * Each fixture in fixtures/ is copied to a temporary directory, gets the
 * packed tarballs plus its third-party dependencies installed, and runs its
 * `verify` script. Nothing resolves through workspace links or source paths.
 */

import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { $ } from "bun";

const ROOT = resolve(import.meta.dir, "..");
const PACKAGES = ["dataview-core", "dataview-react", "dataview-drizzle"];

const rootManifest = JSON.parse(
  readFileSync(join(ROOT, "package.json"), "utf8")
);
const catalog: Record<string, string> = rootManifest.workspaces.catalog;

/** Tools the workspace itself does not use. */
const EXTRA_VERSIONS: Record<string, string> = { vite: "^7.0.0" };

function version(name: string): string {
  const found =
    EXTRA_VERSIONS[name] ??
    catalog[name] ??
    rootManifest.devDependencies?.[name] ??
    rootManifest.dependencies?.[name];
  if (!found) {
    throw new Error(`No pinned version for ${name} in the root package.json`);
  }
  return found;
}

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

/**
 * Typecheck with skipLibCheck off, so errors in our published declarations
 * surface. Errors inside other libraries' declarations are ignored.
 */
async function typecheck(dir: string) {
  const result = await $`bunx tsc --noEmit --pretty false`
    .cwd(dir)
    .nothrow()
    .quiet();
  const errors = result.stdout
    .toString()
    .split("\n")
    .filter((line) => line.includes("error TS"))
    .filter(
      (line) =>
        !line.startsWith("node_modules/") ||
        line.startsWith("node_modules/@sparkyidea/")
    );
  if (errors.length > 0) {
    throw new Error(`Type errors in ${dir}:\n${errors.join("\n")}`);
  }
  console.log("typecheck ok");
}

const work = mkdtempSync(join(tmpdir(), "dataview-fixtures-"));
const tarballDir = join(work, "tarballs");

console.log("Building packages…");
await $`bunx turbo run build ${PACKAGES.map((p) => `--filter=@sparkyidea/${p}`)}`.cwd(
  ROOT
);

const tarballs: Record<string, string> = {};
for (const pkg of PACKAGES) {
  await $`bun pm pack --destination ${tarballDir} --quiet`.cwd(
    join(ROOT, "packages", pkg)
  );
}
for (const file of readdirSync(tarballDir)) {
  const pkg = PACKAGES.find((p) => file.startsWith(`sparkyidea-${p}-`));
  if (pkg) {
    tarballs[`@sparkyidea/${pkg}`] = `file:${join(tarballDir, file)}`;
  }
}

const only = process.argv.slice(2);
const fixtures = Object.keys(FIXTURE_DEPS).filter(
  (name) => only.length === 0 || only.includes(name)
);

for (const name of fixtures) {
  const dir = join(work, name);
  cpSync(join(ROOT, "fixtures", name), dir, { recursive: true });
  const manifestPath = join(dir, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.dependencies = {
    ...tarballs,
    ...Object.fromEntries(FIXTURE_DEPS[name].map((dep) => [dep, version(dep)])),
  };
  // Peer ranges on @sparkyidea/* would otherwise resolve from the registry
  manifest.overrides = tarballs;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`\n▶ ${name} (${dir})`);
  await $`bun install --no-save`.cwd(dir);
  await typecheck(dir);
  await $`bun run verify`.cwd(dir);
}

console.log(`\nAll fixtures passed: ${fixtures.join(", ")}`);
