# CLAUDE.md

Guidelines for Claude Code when working with this repo.

**Read [AGENTS.md](./AGENTS.md) first.** It owns architecture, naming, workflow rules, coding standards, and project structure. This file just points you there.

## Key Commands

```bash
# Development
bun run dev          # Start all apps
bun run dev:web      # Start web only (port 3001)
bun run dev:server   # Start server only (port 3000)

# Quality checks (run before commits)
bun run check        # Lint + format (Ultracite)
bun run check-types  # TypeScript
bun run build        # Full build

# Database
bun run db:push      # Push schema changes
bun run db:studio    # Open Drizzle Studio
```

## Documentation Structure

- **CONTRIBUTING.md** - Dev setup and PR workflow
- **AGENTS.md** - Coding standards, architecture (source of truth)
- **docs/** - Architecture documentation
