/**
 * Set one version on all three headless packages. They always release
 * together at the same version.
 *
 * Usage: bun scripts/release-version.ts <version>
 *   e.g. bun scripts/release-version.ts 0.1.0-alpha.1
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PACKAGES = ["dataview-core", "dataview-react", "dataview-drizzle"];
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const version = process.argv[2];
if (!(version && SEMVER.test(version))) {
  console.error("Usage: bun scripts/release-version.ts <semver version>");
  process.exit(1);
}

for (const pkg of PACKAGES) {
  const path = join(import.meta.dir, "..", "packages", pkg, "package.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  manifest.version = version;
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${manifest.name} → ${version}`);
}

console.log(
  `\nNext: commit, then tag and push:\n  git tag v${version} && git push origin v${version}`
);
