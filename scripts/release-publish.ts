/**
 * Pack and publish the headless packages (run by the Release workflow).
 *
 * `bun pm pack` resolves `workspace:` and `catalog:` ranges; `npm publish`
 * then uploads each tarball (auth from NODE_AUTH_TOKEN, with provenance in
 * GitHub Actions). Versions already on npm are skipped, so a failed run can be
 * re-run.
 *
 * Usage: bun scripts/release-publish.ts <tag> [--dry-run]
 *   <tag> is the git tag, e.g. v0.1.0-alpha.1
 */
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

// Publish order: dependencies first
const PACKAGES = ["dataview-core", "dataview-react", "dataview-drizzle"];
const ROOT = join(import.meta.dir, "..");
const OUT = join(ROOT, "release-tarballs");
// npm refuses to run inside the repo (devEngines requires bun), so run it elsewhere
const NPM_CWD = tmpdir();

const tag = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (!tag?.startsWith("v")) {
  console.error("Usage: bun scripts/release-publish.ts <vX.Y.Z> [--dry-run]");
  process.exit(1);
}
const version = tag.slice(1);

// Prereleases go to their channel (0.1.0-alpha.1 → alpha), others to latest
const distTag = version.includes("-")
  ? (version.split("-")[1]?.split(".")[0] ?? "next")
  : "latest";

mkdirSync(OUT, { recursive: true });

for (const pkg of PACKAGES) {
  const dir = join(ROOT, "packages", pkg);
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  if (manifest.version !== version) {
    console.error(
      `${manifest.name} is ${manifest.version}, tag is ${tag}. Run scripts/release-version.ts first.`
    );
    process.exit(1);
  }

  const published = await $`npm view ${`${manifest.name}@${version}`} version`
    .cwd(NPM_CWD)
    .quiet()
    .nothrow();
  if (published.exitCode === 0 && published.stdout.toString().trim()) {
    console.log(`${manifest.name}@${version} already on npm, skipping`);
    continue;
  }

  await $`bun pm pack --destination ${OUT} --quiet`.cwd(dir);
  const prefix = `${manifest.name.replace("@", "").replace("/", "-")}-${version}`;
  const tarball = readdirSync(OUT).find(
    (file) => file.startsWith(prefix) && file.endsWith(".tgz")
  );
  if (!tarball) {
    console.error(`No tarball found for ${manifest.name}`);
    process.exit(1);
  }

  const args = [join(OUT, tarball), "--access", "public", "--tag", distTag];
  if (process.env.GITHUB_ACTIONS === "true") {
    args.push("--provenance");
  }
  if (dryRun) {
    args.push("--dry-run");
  }
  console.log(`Publishing ${manifest.name}@${version} (${distTag})`);
  await $`npm publish ${args}`.cwd(NPM_CWD);
}
