/**
 * Shared helpers for the package and registry fixture checks: pack the
 * headless packages, prepare a fixture in a temporary directory, and
 * typecheck it.
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

export const ROOT = resolve(import.meta.dir, "../..");
export const PACKAGES = ["dataview-core", "dataview-react", "dataview-drizzle"];

const rootManifest = JSON.parse(
  readFileSync(join(ROOT, "package.json"), "utf8")
);
const catalog: Record<string, string> = rootManifest.workspaces.catalog;

/** Tools the workspace itself does not use. */
const EXTRA_VERSIONS: Record<string, string> = {
  "@tailwindcss/vite": "4.1.18",
  "@vitejs/plugin-react": "^5.0.0",
  vite: "^7.0.0",
};

export function version(name: string): string {
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

export function makeWorkDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/** Build and pack the headless packages; returns `name -> file:` specifiers. */
export async function packPackages(
  work: string
): Promise<Record<string, string>> {
  const tarballDir = join(work, "tarballs");
  console.log("Building packages…");
  await $`bunx turbo run build ${PACKAGES.map((p) => `--filter=@sparkyidea/${p}`)}`
    .cwd(ROOT)
    .quiet();
  for (const pkg of PACKAGES) {
    await $`bun pm pack --destination ${tarballDir} --quiet`
      .cwd(join(ROOT, "packages", pkg))
      .quiet();
  }
  const tarballs: Record<string, string> = {};
  for (const file of readdirSync(tarballDir)) {
    const pkg = PACKAGES.find((p) => file.startsWith(`sparkyidea-${p}-`));
    if (pkg) {
      tarballs[`@sparkyidea/${pkg}`] = `file:${join(tarballDir, file)}`;
    }
  }
  return tarballs;
}

/**
 * Copy fixtures/<name> to the work directory and install the tarballs plus
 * the listed third-party dependencies. Tarball overrides stay in place so
 * later installs (for example by the shadcn CLI) also resolve them.
 */
export async function prepareFixture(
  name: string,
  work: string,
  tarballs: Record<string, string>,
  deps: string[]
): Promise<string> {
  const dir = join(work, name);
  cpSync(join(ROOT, "fixtures", name), dir, { recursive: true });
  const manifestPath = join(dir, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.dependencies = {
    ...tarballs,
    ...Object.fromEntries(deps.map((dep) => [dep, version(dep)])),
  };
  // Peer ranges on @sparkyidea/* would otherwise resolve from the registry
  manifest.overrides = tarballs;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\n▶ ${name} (${dir})`);
  await $`bun install`.cwd(dir).quiet();
  return dir;
}

/**
 * Typecheck with skipLibCheck off, so errors in our published declarations
 * surface. Errors inside other libraries' declarations are ignored.
 */
export async function typecheck(dir: string): Promise<void> {
  const result = await $`bunx tsc --noEmit --pretty false --skipLibCheck false`
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
