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
git clone https://github.com/ocean-dataview/ocean-dataview.git
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
| `packages/dataview` | Core DataView components           |
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

## Links

- GitHub Issues: https://github.com/ocean-dataview/ocean-dataview/issues
- Discussions: https://github.com/ocean-dataview/ocean-dataview/discussions

Thanks for contributing!
