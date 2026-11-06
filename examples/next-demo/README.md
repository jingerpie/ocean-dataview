# DataView npm demo

The same demo as `apps/web` (table, list, gallery and board over the product
dataset), minus the docs, built the way a real project would:

- `@jingerpie/dataview-core`, `-react` and `-drizzle` come from npm,
  pinned to an exact version.
- The UI (`components/dataview`, `components/ui`, `hooks`, `lib`) is
  installed with `shadcn add` from the DataView registry and committed as
  generated source.
- The backend runs inside Next: tRPC at `/api/trpc` and Drizzle over
  [PGlite](https://pglite.dev) (in-process Postgres), seeded from
  `data/products.json` on first request. No database to set up. Data lives in
  memory, so it resets on restart.

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

## Copied from the monorepo

Copied at `3b78e2f` with imports rewritten to local paths. Re-copy when the
originals change.

| Here | Source |
| --- | --- |
| `app/(demo)/`, `app/page.tsx`, `app/layout.tsx` | `apps/web/src/app/` |
| `modules/dataview/` | `apps/web/src/modules/dataview/` (+ `lib/validations.ts`) |
| `components/{layouts,client-providers,server-providers,icons.tsx}` | `apps/web/src/components/` (Docs link removed) |
| `utils/trpc/` | `apps/web/src/utils/trpc/` (points at `/api/trpc`) |
| `server/product-router.ts`, `server/schema.ts` | `packages/trpc/src/routers/product.ts`, `packages/db/src/schema/product.ts` |
| `data/products.json` | `packages/db/src/seed/products.json` |
