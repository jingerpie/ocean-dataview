# Headless Packages + shadcn Registry Distribution

## Context

`packages/dataview` is one workspace package that mixes framework-agnostic logic, React state, and styled shadcn-based UI. dashseller and sellerhunt vendor a copy of it and sync changes by hand, which already caused a drift of ~40 commits.

Goal: follow the better-auth-ui distribution model.

1. **Headless logic as npm packages** — versioned, installed, updated with a version bump.
2. **Customizable UI via a shadcn registry** — users run `npx shadcn add`, own the copied source, and restyle freely.

Reviewed with Codex (2026-11-05). Codex agreed with the three-package direction and corrected several points; those are folded in below.

**No backward compatibility.** This is a full refactor. Public APIs, import paths, and prop names may change freely; demos, docs, and tests are updated in the same change. No adapters, deprecated aliases, or compatibility re-export layer.

## Reference: better-auth-ui

Source: `better-auth-ui-main` (studied 2026-11-05).

- `packages/core` (framework-agnostic: config, query-core options, localization), `packages/react` (headless `AuthProvider`, `useAuth`, query/mutation hooks — no styled UI), `packages/locales`, `packages/heroui` (packaged UI, because HeroUI has no copy-in registry).
- All dependencies external and declared as peers. Exports carry a `src` custom condition so example apps compile against package source.
- shadcn UI lives in a real app (`examples/start-shadcn-example/src/components/auth`). `registry.metadata.json` lists entry files only; `scripts/build-registry.ts` follows imports to infer `registryDependencies` (`@/components/ui/x`) and npm `dependencies`, validates against `shadcn/schema`, and runs `shadcn build` into `apps/docs/public/r/{style}`.
- Copied components import logic from npm (`@better-auth-ui/react`) and primitives from the user's `@/components/ui`.
- UI plugins spread the core plugin and attach components to slots; module augmentation widens core types for the UI layer.

## Target Layout

| Package | Contents | Peers |
|---|---|---|
| `@sparkyidea/dataview-core` | Domain and query schemas (`types/*` minus React presentation fields), validators, URL DSL encode/decode, pure parsers, filter/group/sort/compute/transform utils, chart data transforms, `filter-preview`, `build-search`, transport-neutral input schemas (from `packages/trpc/src/lib/schemas.ts`), `get-skeleton-props`, `skeleton-widths`, `row-id` | `zod`, `date-fns`, `chrono-node` |
| `@sparkyidea/dataview-react` | Providers (`DataViewProvider`, `SimpleDataViewProvider`, `ChartViewProvider`), query bridges, contexts, controllers, hooks, per-instance stores. `/nuqs` subpath for URL-state integration, `/nuqs/server` for server-safe parsers and cache. Controlled (non-URL) state supported independently | `react`, `@tanstack/react-query`, `zustand`, optional `nuqs` |
| `@sparkyidea/dataview-drizzle` | `buildWhere`, `buildSort`/`buildCursor`, `buildGroupBy`/`buildGroupWhere`, `build-rollup`. Documented as **PostgreSQL only** (casts, arrays, aggregate SQL are dialect-specific) | `drizzle-orm`, `dataview-core` |
| shadcn registry (`apps/web/public/r`) | Views, notion toolbar, preset tabs, skeletons, property renderers, filter/sort/group/pagination/bulk-action UI, property icons, badge and chart colors, chart rendering, customized primitives | resolved per item |

Decisions:

- **Three packages, not one with subpaths.** One package is simpler to publish, but optional React and Drizzle dependencies plus accidental client/server imports are harder to police. Keep narrow subpath exports inside each package.
- **TanStack Table stays in registry UI.** Its imports are confined to the table and bulk-action components today. Extract a renderer-independent selection contract only if needed later.
- **TanStack Query stays in `dataview-react`.** Framework-neutral query-option factories can move to core later.
- **Build tool: keep `tsdown`.** Already used in the repo; a Vite/Nx migration adds no architectural benefit. Preserve `"use client"` directives and externalize all dependencies.

## Phase 1 — Decouple in place

Stay in the single `packages/dataview` package so the demos keep exercising every change. Update call sites directly; no adapters.

Changes:

1. **Provider markup and child protocol.**
   - Remove the `cn()` wrapper `<div>` in `lib/providers/data-view-provider.tsx:294` and `chart-view-provider.tsx:45`; registry UI owns layout.
   - Replace `detectViewMetadata` (`data-view-provider.tsx:90-105`, static `dataViewType`/`defaultLimit` on child views) and toolbar-child classification with explicit `view` / `defaultLimit` props.
2. **Presentation types out of core types.** Split React-dependent fields (`IconComponent`, render functions, React imports in `types/{property,filter,action}.type.ts`) into a UI type layer so server consumers do not need React declarations.
3. **Styling out of logic utils.**
   - `lib/property-icons.ts` (lucide): core keeps a `PropertyType → icon name` map; UI maps names to icons.
   - `utils/badge-colors.ts`, `utils/get-badge-variant.ts`, `utils/chart-colors.ts`: move to UI.
   - `utils/resolve-show-name.ts:46`: return an `align` value; UI maps it to classes.
4. **Per-instance stores.** `hooks/use-sort-builder.ts`, `use-advance-filter-builder.ts`, `use-simple-filter-chip.ts` create module-level Zustand stores. Scope them per DataView instance. Add a URL parameter namespace per instance.
5. **Logic out of components into hooks.**
   - `useBoardModel` from `components/views/board-view/index.tsx:193-307`.
   - `useRowSelection` from `components/views/table-view/index.tsx:166`.
   - `usePresetTabs` from `components/preset-tabs/index.tsx:125-160`.
   - Shared `InfiniteScrollGroupsSentinel` and `ScrollSyncBar` (duplicated in board and table views) using refs instead of `document.getElementById` / `querySelector`.
6. **Charts.** `hooks/use-interactive-legend.ts` imports a private Recharts type path; accept a minimal structural payload instead. Chart computation goes to core, memoization to React, Recharts rendering to the registry.
7. **Framework lock-in.** Replace `next/image` in `components/views/data-card.tsx` and `components/ui/properties/files-media-property.tsx` with an injectable image slot (default `<img>`).
8. **Dependency cleanup.** Remove unused deps: `react-hook-form`, `@hookform/resolvers`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-resizable-panels`, `sonner`, `vaul`. Check `styles.css` before removing `tw-animate-css`.

Acceptance:

- All demos render and behave as before (call sites updated); `bun run check`, `check-types`, `test`, `build` pass.
- Two DataViews on one page stay independent (filters, sort builder, selection).
- URL round trips and pagination behave as before.
- Lint rule or test: nothing under `types/`, `utils/` (logic), `parsers/`, `validators/`, `lib/url-dsl/` imports React, lucide, `cn`, or `components/`.

Risks: default values, selection identity, and scroll sync can regress. Mitigate with tests around `row-id`, URL codecs, and a two-instance demo page.

## Phase 2 — Publish prerelease headless packages

Changes:

1. Create `packages/dataview-core`, `packages/dataview-react`, `packages/dataview-drizzle`; move files per the target layout. Build JS and declarations with `tsdown`; all dependencies external; peers declared.
2. Extract pure encode/decode from `src/parsers/*` (currently importing `nuqs/server`) into core; nuqs wrappers go to `dataview-react/nuqs` and `dataview-react/nuqs/server`.
3. Delete the npm surface of `@sparkyidea/dataview`; its remaining UI moves to the registry source in Phase 3. Until then it is a private workspace package for the demos only.
4. Publish `0.x` prereleases.

Acceptance:

- Install the packed tarballs (`bun pm pack`) into clean server and React fixtures **without source aliases**; typecheck and build pass.
- Existing parser and SQL builder tests run against the built packages.

Risks: a `src` export condition can hide broken published exports during development. The packed-artifact fixtures are the guard.

## Phase 3 — Ship the registry

Changes:

1. Move the canonical UI into `apps/web/src/registry`; demos consume that source directly, so shipped code is the tested code.
2. Add `registry.metadata.json` (entry files per item) and a build script that follows imports to infer `registryDependencies` and npm `dependencies`, validates with `shadcn registry validate`, and runs `shadcn build` into `apps/web/public/r`.
3. Primitives:
   - Stock shadcn primitives (card, dropdown-menu, input-group, input, kbd, popover, separator, skeleton, textarea, tooltip, button-group, dialog) become plain `registryDependencies`.
   - Customized primitives (accordion, badge `size`, button, calendar `readOnly`, checkbox indeterminate, command `CommandChips`, select `render`, table, tabs) and `chart.tsx` ship as **distinctly named** `registry:ui` items so they never overwrite a user's `button.tsx` etc. Upstream to shadcn only where the API already matches.
   - Reuse the user's `cn`.
4. CSS: `src/styles.css` only contains `@source "."`; the real badge and chart tokens, dark-mode values, and Tailwind mappings live in `packages/ui/src/styles/globals.css`. Ship dataview-specific tokens and animations through registry `cssVars` / `css`, without copying the app's global theme.
5. Copied files import only public npm exports (`@sparkyidea/dataview-react`, `-core`) and local registry files. Forbid workspace aliases and private paths (enforced in the build script).
6. Pin compatible npm ranges in registry items and keep versioned registry artifacts, because copied UI does not update automatically.
7. Rollout order: table view, gallery view, notion toolbar first; then list, board, charts.

Acceptance:

- Clean Next.js and Vite apps: `npx shadcn add <registry-url>/table-view.json` compiles and renders, including dark mode.
- Registry dependency graph test (every import resolved, no private paths).

Risks: primitive name conflicts and missing CSS tokens in the consumer app.

## Phase 4 — Migrate consumers

Changes:

1. dashseller and sellerhunt: replace the vendored `packages/dataview` (`workspace:*`) with npm versions of the headless packages.
2. Install UI through the registry into app-owned component folders; rewrite imports.
3. Migrate one view first (one table page), then the rest; delete the vendored package last.
4. Back-port local customizations deliberately (diff vendored copy against registry output before replacing).

Acceptance: production builds and representative interactions (filter, sort, group, pagination, bulk actions) pass in both apps.

Risks: local customizations in the vendored copies need manual merging.

## Deferred

- Base UI vs Radix registry variants (better-auth-ui override-list pattern). Not needed while all apps use Base UI.
- Fixed-version release automation across the three packages (conventional commits). Set version compatibility rules in Phase 2; automate later.
- Additional visual styles.
