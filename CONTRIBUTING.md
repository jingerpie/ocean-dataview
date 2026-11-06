# Contributing to Ocean DataView

> **Using an AI coding assistant?** Read [AGENTS.md](./AGENTS.md) for comprehensive architecture and coding guidelines.

Thanks for helping! This guide covers development setup and workflow expectations.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.9
- [Node.js](https://nodejs.org) >= 20 (for some tooling)
- [PostgreSQL](https://www.postgresql.org) >= 15
- Docker (optional, for database)

### 1. Clone and Install

```bash
git clone https://github.com/jingerpie/dataview.git
cd ocean-dataview
bun install
```

### 2. Set Up Environment Files

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/server/.env.example apps/server/.env
```

### 3. Start Database

#### Option A: Docker (Recommended)

```bash
docker compose up postgres -d
```

#### Option B: Local PostgreSQL

Ensure PostgreSQL is running and update `DATABASE_URL` in your env files.

### 4. Initialize Database

```bash
bun run db:migrate
```

### 5. Start Development Servers

```bash
# Start all apps
bun run dev

# Or start specific apps
bun run dev:web     # Next.js web app
bun run dev:server  # API server
```

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001

## Common Commands

```bash
# Development
bun run dev          # Start all apps
bun run dev:web      # Start web app only
bun run dev:server   # Start API server only

# Quality (required before PRs)
bun run check        # Lint + format check
bun run check-types  # TypeScript check
bun run build        # Build all packages

# Database
bun run db:generate  # Generate migrations
bun run db:migrate   # Apply migrations
bun run db:studio    # Open Drizzle Studio
```

## Repository Structure

| Directory           | Description                        |
| ------------------- | ---------------------------------- |
| `apps/web`          | Next.js web application            |
| `apps/server`       | Hono API server                    |
| `packages/dataview-core` | Framework-neutral types and logic |
| `packages/dataview-react` | Headless React providers and hooks |
| `packages/dataview-drizzle` | PostgreSQL SQL builders |
| `apps/web/src/registry` | Styled DataView UI (shadcn registry) |
| `packages/db`       | Drizzle schema + migrations        |
| `packages/shared`   | Shared types and utilities         |
| `packages/ui`       | UI component library               |
| `docs/`             | Documentation                      |

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running: `docker compose ps`
2. Check `DATABASE_URL` in your env files
3. Ensure migrations are applied: `bun run db:migrate`

### Port Conflicts

Stop conflicting services or modify ports in your env files.

### Clean Install

```bash
rm -rf node_modules bun.lock
bun install
```

---

## Pull Request Workflow

1. Pick or file an issue, branch from `main`
2. Build the feature/fix
3. Run `bun run check && bun run check-types && bun run build`
4. Open a PR with a [Conventional Commit](https://www.conventionalcommits.org/) title

### PR Title Format

```
<type>(scope): description
```

- `feat(scope): ...` → New feature
- `fix(scope): ...` → Bug fix
- `refactor(scope): ...` → Code refactoring
- `docs(scope): ...` → Documentation
- Breaking change → add `!`: `feat(scope)!: ...`

Scopes: `dataview`, `web`, `server`, `db`, `ui`, `shared`, `docs`

### PR Checklist

- [ ] Conventional Commit title
- [ ] Linked issue or context
- [ ] All checks pass locally (`bun run check && bun run check-types`)
- [ ] Docs updated (if user-facing)
- [ ] Screenshot attached (if visual change)

## Releasing the npm packages

`@jingerpie/dataview-core`, `-react`, and `-drizzle` always release together at one version.

1. Bump all three: `bun scripts/release-version.ts 0.1.0-alpha.1`
2. Commit the bump and merge it.
3. Tag and push: `git tag v0.1.0-alpha.1 && git push origin v0.1.0-alpha.1`

The tag starts `.github/workflows/release.yml`. It runs the checks, builds, verifies the packed packages, publishes in dependency order, and creates a GitHub Release. Prerelease versions publish under their channel (`-alpha.N` → `alpha`); others under `latest`. Versions already on npm are skipped, so a failed run can be re-run. Run it manually (Actions → Release) with dry run on to test without publishing.

Publishing uses the `NPM_TOKEN` repository secret: a granular npm access token with read and write on the three packages and "Bypass 2FA" enabled. npm write tokens expire, so replace the secret before it does. Each version gets npm provenance linking it to the workflow run.

The shadcn registry ships with the `apps/web` deploy, not with this workflow.

## Links

- GitHub Issues: https://github.com/jingerpie/dataview/issues
- Discussions: https://github.com/jingerpie/dataview/discussions

Thanks for contributing!
