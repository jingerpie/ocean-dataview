# Package fixtures

Consumer projects that install the packed `@jingerpie/dataview-*` tarballs
(no workspace links, no source aliases) and check that the published
exports typecheck, bundle, and run.

- `server` — core schemas and codecs, Drizzle SQL builders, nuqs server parsers.
- `react-vite` — controlled (non-URL) state without nuqs; Vite build plus a server render.
- `react-next` — Next.js App Router with nuqs URL state and server-side params cache.

Run all of them from the repo root:

```bash
bun run verify:packages
```

The fixtures are not workspaces. `scripts/verify-packages.ts` copies each one
to a temporary directory, installs the tarballs, and runs its `verify` script.
