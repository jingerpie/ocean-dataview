# DataView npm demo

A standalone Next.js app that uses DataView the way a real project does:

- `@jingerpie/dataview-core` and `@jingerpie/dataview-react` come from npm,
  pinned to an exact version.
- The UI (`components/`, `hooks/`, `lib/`) is installed with `shadcn add`
  from the DataView registry and committed as generated source.

It lives outside the monorepo workspaces on purpose, so Bun never links the
local packages. Use `apps/web` for live development of the packages; use this
app to see what users get from the published release.

## Run

```bash
bun install
bun run dev      # http://localhost:3005
```

## Refresh

```bash
bun run refresh:packages 0.1.0-alpha.1   # pin a newly published version
bun run refresh:ui                       # reinstall UI from ../../apps/web's registry
bun run refresh:ui https://example.com   # or from a deployed registry base URL
```

`refresh:ui` builds the registry from the current `apps/web` source, so it
tests today's registry against the pinned npm packages. Review the diff before
committing. Generated files are excluded from Biome in the root `biome.jsonc`.
