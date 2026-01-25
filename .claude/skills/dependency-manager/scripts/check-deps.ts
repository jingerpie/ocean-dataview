#!/usr/bin/env bun

/**
 * Dependency validation script for Bun monorepo catalog-based dependency management.
 * Checks for violations: hardcoded versions, missing catalog entries, misplaced deps.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  workspaces?: {
    packages?: string[];
    catalog?: Record<string, string>;
  };
}

interface Violation {
  file: string;
  type: "hardcoded" | "missing-catalog" | "root-app-dep";
  package: string;
  version: string;
  section: string;
}

const ROOT_INFRA_PACKAGES = new Set([
  "@biomejs/biome",
  "biome",
  "turbo",
  "husky",
  "lint-staged",
  "prettier",
  "eslint",
  "@turbo/gen",
  "typescript", // sometimes needed at root for IDE
]);

function isInfraPackage(pkg: string): boolean {
  if (ROOT_INFRA_PACKAGES.has(pkg)) {
    return true;
  }
  if (pkg.startsWith("@types/bun")) {
    return true;
  }
  return false;
}

function isCatalogRef(version: string): boolean {
  return version === "catalog:" || version.startsWith("catalog:");
}

function isWorkspaceRef(version: string): boolean {
  return version.startsWith("workspace:");
}

function checkDependencySection(
  deps: Record<string, string> | undefined,
  section: string,
  file: string,
  catalog: Record<string, string>,
  isRoot: boolean
): Violation[] {
  if (!deps) {
    return [];
  }
  const violations: Violation[] = [];

  for (const [pkg, version] of Object.entries(deps)) {
    if (isWorkspaceRef(version)) {
      continue;
    }

    if (isRoot) {
      // Root should only have infrastructure packages
      if (!isInfraPackage(pkg)) {
        violations.push({
          file,
          type: "root-app-dep",
          package: pkg,
          version,
          section,
        });
      }
    } else if (!isCatalogRef(version)) {
      // Workspace packages must use catalog:
      violations.push({
        file,
        type: "hardcoded",
        package: pkg,
        version,
        section,
      });
    } else if (!catalog[pkg]) {
      // Check if referenced package exists in catalog
      violations.push({
        file,
        type: "missing-catalog",
        package: pkg,
        version,
        section,
      });
    }
  }

  return violations;
}

function getViolationDisplay(v: Violation): { icon: string; msg: string } {
  if (v.type === "hardcoded") {
    return {
      icon: "⚠️",
      msg: `Hardcoded version "${v.version}" should be "catalog:"`,
    };
  }
  if (v.type === "missing-catalog") {
    return {
      icon: "❓",
      msg: `"${v.package}" not found in catalog`,
    };
  }
  return {
    icon: "🚫",
    msg: `Application dependency should be in catalog, not root ${v.section}`,
  };
}

function reportViolations(violations: Violation[]): void {
  // Group by file
  const byFile = new Map<string, Violation[]>();
  for (const v of violations) {
    if (!byFile.has(v.file)) {
      byFile.set(v.file, []);
    }
    byFile.get(v.file)?.push(v);
  }

  for (const [file, fileViolations] of byFile) {
    console.log(`📄 ${file}`);
    for (const v of fileViolations) {
      const { icon, msg } = getViolationDisplay(v);
      console.log(`   ${icon} ${v.section}.${v.package}: ${msg}`);
    }
    console.log();
  }
}

function printSuggestedFixes(violations: Violation[]): void {
  console.log("💡 Suggested fixes:");

  const hardcoded = violations.filter((v) => v.type === "hardcoded");
  const missingCatalog = violations.filter((v) => v.type === "missing-catalog");
  const rootAppDeps = violations.filter((v) => v.type === "root-app-dep");

  if (hardcoded.length > 0) {
    console.log("\n  For hardcoded versions:");
    console.log("  1. Add the version to root package.json workspaces.catalog");
    console.log('  2. Replace the version with "catalog:" in the workspace');
  }

  if (missingCatalog.length > 0) {
    console.log("\n  For missing catalog entries:");
    console.log(
      "  Add the package with its version to root package.json workspaces.catalog"
    );
  }

  if (rootAppDeps.length > 0) {
    console.log("\n  For application deps in root:");
    console.log("  1. Move the version to workspaces.catalog");
    console.log("  2. Remove from root dependencies/devDependencies");
    console.log('  3. Add to the appropriate workspace with "catalog:"');
  }
}

function main() {
  const rootDir = process.cwd();
  const rootPkgPath = join(rootDir, "package.json");

  if (!existsSync(rootPkgPath)) {
    console.error("❌ No package.json found in current directory");
    process.exit(1);
  }

  const rootPkg: PackageJson = JSON.parse(readFileSync(rootPkgPath, "utf-8"));
  const catalog = rootPkg.workspaces?.catalog ?? {};

  console.log("🔍 Checking dependencies...\n");

  const violations: Violation[] = [];

  // Check root package.json
  violations.push(
    ...checkDependencySection(
      rootPkg.dependencies,
      "dependencies",
      "package.json",
      catalog,
      true
    )
  );
  violations.push(
    ...checkDependencySection(
      rootPkg.devDependencies,
      "devDependencies",
      "package.json",
      catalog,
      true
    )
  );

  // Find workspace packages
  const appsGlob = new Glob("apps/*/package.json");
  const packagesGlob = new Glob("packages/*/package.json");
  const workspacePaths = [
    ...appsGlob.scanSync({ cwd: rootDir }),
    ...packagesGlob.scanSync({ cwd: rootDir }),
  ];

  let packagesChecked = 1; // root

  for (const pkgPath of workspacePaths) {
    const fullPath = join(rootDir, pkgPath);
    if (!existsSync(fullPath)) {
      continue;
    }

    const pkg: PackageJson = JSON.parse(readFileSync(fullPath, "utf-8"));
    packagesChecked++;

    for (const section of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ] as const) {
      violations.push(
        ...checkDependencySection(
          pkg[section],
          section,
          pkgPath,
          catalog,
          false
        )
      );
    }
  }

  // Report results
  console.log(`📦 Packages checked: ${packagesChecked}`);
  console.log(`📋 Catalog entries: ${Object.keys(catalog).length}\n`);

  if (violations.length === 0) {
    console.log("✅ No violations found!");
    process.exit(0);
  }

  console.log(`❌ Found ${violations.length} violation(s):\n`);

  reportViolations(violations);
  printSuggestedFixes(violations);

  process.exit(1);
}

main();
