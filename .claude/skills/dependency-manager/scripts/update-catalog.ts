#!/usr/bin/env bun
/**
 * Updates all package versions in the workspace catalog to their latest versions.
 * Usage: bun run scripts/update-catalog.ts
 */

import { readFileSync, writeFileSync } from "node:fs";

const PACKAGE_JSON_PATH = "./package.json";
const VERSION_PREFIX_REGEX = /^[\^~]/;

interface PackageJson {
  workspaces: {
    catalog: Record<string, string>;
    packages: string[];
  };
  [key: string]: unknown;
}

async function getLatestVersion(packageName: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${packageName}/latest`
    );
    if (!response.ok) {
      console.error(`  ✗ Failed to fetch ${packageName}: ${response.status}`);
      return null;
    }
    const data = (await response.json()) as { version: string };
    return data.version;
  } catch (error) {
    console.error(`  ✗ Error fetching ${packageName}:`, error);
    return null;
  }
}

function parseVersion(version: string): string {
  // Remove ^ or ~ prefix to get the actual version
  return version.replace(VERSION_PREFIX_REGEX, "");
}

async function main() {
  console.log("📦 Updating workspace catalog versions...\n");

  // Read package.json
  const packageJson: PackageJson = JSON.parse(
    readFileSync(PACKAGE_JSON_PATH, "utf-8")
  );

  if (!packageJson.workspaces?.catalog) {
    console.error("No workspaces.catalog found in package.json");
    process.exit(1);
  }

  const catalog = packageJson.workspaces.catalog;
  const packages = Object.keys(catalog);
  const updates: Array<{
    name: string;
    from: string;
    to: string;
  }> = [];

  console.log(`Found ${packages.length} packages in catalog\n`);

  // Fetch latest versions in parallel (batch of 10)
  const batchSize = 10;
  for (let i = 0; i < packages.length; i += batchSize) {
    const batch = packages.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (pkg) => {
        const currentVersion = parseVersion(catalog[pkg]);
        const latestVersion = await getLatestVersion(pkg);
        return { pkg, currentVersion, latestVersion };
      })
    );

    for (const { pkg, currentVersion, latestVersion } of results) {
      if (!latestVersion) {
        continue;
      }

      if (currentVersion !== latestVersion) {
        updates.push({
          name: pkg,
          from: currentVersion,
          to: latestVersion,
        });
        catalog[pkg] = latestVersion;
        console.log(`  ↑ ${pkg}: ${currentVersion} → ${latestVersion}`);
      } else {
        console.log(`  ✓ ${pkg}: ${currentVersion} (up to date)`);
      }
    }
  }

  if (updates.length === 0) {
    console.log("\n✅ All packages are up to date!");
    return;
  }

  // Sort catalog alphabetically
  const sortedCatalog: Record<string, string> = {};
  for (const key of Object.keys(catalog).sort()) {
    sortedCatalog[key] = catalog[key];
  }
  packageJson.workspaces.catalog = sortedCatalog;

  // Write back to package.json
  writeFileSync(
    PACKAGE_JSON_PATH,
    `${JSON.stringify(packageJson, null, "\t")}\n`
  );

  console.log(`\n✅ Updated ${updates.length} packages`);
  console.log("\nRun 'bun install' to install the new versions.");
}

main().catch(console.error);
