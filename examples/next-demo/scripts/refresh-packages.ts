/**
 * Pin the demo to a published version of the DataView packages.
 *
 * Usage: bun scripts/refresh-packages.ts <version>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const version = process.argv[2];
if (!version) {
  console.error("Usage: bun scripts/refresh-packages.ts <version>");
  process.exit(1);
}

const DEMO = join(import.meta.dir, "..");
const manifestPath = join(DEMO, "package.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
for (const name of Object.keys(manifest.dependencies)) {
  if (name.startsWith("@jingerpie/dataview-")) {
    manifest.dependencies[name] = version;
  }
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await $`bun install`.cwd(DEMO);
