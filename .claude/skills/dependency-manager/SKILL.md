---
name: dependency-manager
description: Manages dependencies in a Bun monorepo using catalog-based versioning. Use when (1) adding, removing, or updating dependencies, (2) editing any package.json file, (3) checking for dependency violations, (4) upgrading packages to latest versions, (5) user mentions "deps", "dependencies", or "catalog".
---

# Dependency Manager

Enforces catalog-based dependency management for this Bun monorepo.

## Rules

### Root package.json
- `dependencies`/`devDependencies`: ONLY monorepo infrastructure (turbo, husky, lint-staged, biome)
- `workspaces.catalog`: ALL application/library versions (single source of truth)

### Workspace package.json
- ALL deps must use `"catalog:"` or `"workspace:*"` (for internal packages)
- NO hardcoded versions

## Tasks

### Check Dependencies
Run the validation script:
```bash
bun .claude/skills/dependency-manager/scripts/check-deps.ts
```

### Add New Dependency
1. Add version to `workspaces.catalog` in root package.json (alphabetically sorted)
2. Add `"package-name": "catalog:"` to target workspace package.json
3. Run `bun install`

Example - adding `lodash` to `apps/web`:
```json
// root package.json
"workspaces": {
  "catalog": {
    "lodash": "^4.17.21"  // add here
  }
}

// apps/web/package.json
"dependencies": {
  "lodash": "catalog:"  // reference here
}
```

### Fix Violations
1. Move hardcoded versions to root `workspaces.catalog`
2. Replace hardcoded version with `"catalog:"` in workspace
3. Run `bun install`

### Update All Packages to Latest
Run the update script:
```bash
bun .claude/skills/dependency-manager/scripts/update-catalog.ts
```
This fetches latest versions from npm and updates the catalog. Run `bun install` after.

## File Locations
- Root: `package.json`
- Apps: `apps/*/package.json`
- Packages: `packages/*/package.json`
