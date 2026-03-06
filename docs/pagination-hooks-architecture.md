# Pagination Hooks Architecture

Technical documentation for the DataView pagination system.

---

## Overview

The pagination system orchestrates data fetching across four view types using a unified hook-based architecture built on three core technologies:

| Technology | Role |
|------------|------|
| **TanStack Query** | Data fetching, caching, and state management |
| **nuqs** | URL state synchronization for pagination cursors, filters, sorts |
| **tRPC** | Type-safe API layer with `getMany` and `getManyByColumn` endpoints |

### Core Principles

1. **Unified UI model**: flat mode is represented as a virtual group key (`"__ungrouped__"`), so views can render one grouped layout path.
2. **Split fetch strategy**: flat and grouped modes use different query plans for performance and clarity.
3. **Suspense-first fetching**: use `useSuspenseQuery` and `useSuspenseInfiniteQuery` for item queries and per-group boundaries.

---

## View Types and Data Routes

### Standard Views (Table, List, Gallery)

All standard views share the same data fetching pattern using `getMany`:

```
┌──────────────────────────────────────────────────────────────┐
│  Standard Views                                               │
│                                                               │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                     │
│  │  Table  │   │  List   │   │ Gallery │                     │
│  └────┬────┘   └────┬────┘   └────┬────┘                     │
│       │             │             │                           │
│       └─────────────┼─────────────┘                           │
│                     ▼                                         │
│              trpc.product.getMany                             │
│                                                               │
│  - Flat: 1 query (all items)                                  │
│  - Grouped: N queries (1 per group × expanded groups)         │
└──────────────────────────────────────────────────────────────┘
```

### Board View

Board has intrinsic column grouping. To reduce complexity, it uses a specialized endpoint:

```
┌──────────────────────────────────────────────────────────────┐
│  Board View                                                   │
│                                                               │
│  ┌─────────────────────────────────────────────┐             │
│  │  Board (Columns = "Groups")                  │             │
│  └──────────────────────┬──────────────────────┘             │
│                         ▼                                     │
│              trpc.product.getManyByColumn                     │
│                                                               │
│  - Returns flat data with X items per column                  │
│  - Flat: 1 query (returns all columns at once)                │
│  - Grouped: N queries (1 per row-group × expanded rows)       │
│                                                               │
│  This mirrors standard views: getMany × N = getManyByColumn × N│
└──────────────────────────────────────────────────────────────┘
```

**Rationale**: `getManyByColumn` returns data for all columns in a single response, each column with its own limit. This keeps board's per-column pagination consistent with how other views handle per-group pagination.

---

## Pagination Modes

### Page Pagination (Table)

URL-synced cursor-based navigation:

| State | Storage | Example |
|-------|---------|---------|
| Cursor (flat) | URL via nuqs | `?cursors=after.894.25` |
| Cursor (grouped) | URL via nuqs | `?cursors=Electronics.after.abc.10,Clothing.before.xyz.20` |

Format: `{direction}.{cursor}.{start}` or `{groupKey}.{direction}.{cursor}.{start}`

See [URL Encoding Rules](./url-encoding-rules.md) for complete URL state specification.

### Infinite Pagination (List, Gallery, Board)

Load-more pattern with accumulated pages:

| State | Storage | Example |
|-------|---------|---------|
| Page cursors | TanStack Query internal | Managed by `useInfiniteQuery` |
| Expanded groups | URL via nuqs | `?expanded=Electronics,Clothing` |

---

## Hybrid Flat/Grouped Strategy

Hybrid mode (user can toggle `groupBy`) should use a **single UI shape** with a **mode-aware query plan**:

| Concern | Flat mode (`groupBy = null`) | Grouped mode (`groupBy != null`) |
|---------|-------------------------------|-----------------------------------|
| Render keys | `["__ungrouped__"]` | `Object.keys(groupCounts)` |
| Expanded groups | Force `["__ungrouped__"]` | User-controlled accordion state |
| Metadata query | None | `getGroup(groupBy)` |
| Item queries | 1 query total | 1 query per expanded group |

### Switching Rules

When group structure changes (property/type/showAs):
- Reset page cursors or infinite pages
- Reset expanded groups

Mode transitions:
- Grouped → Flat: set expanded to `["__ungrouped__"]`
- Flat → Grouped: initialize expanded as empty (or configured default)

This keeps switching simple while avoiding unnecessary group metadata queries in flat mode.

---

## Hook Architecture

### Two Primary Hooks

```
┌─────────────────────────────────────────────────────────────────┐
│                        Pagination Hooks                          │
│                                                                  │
│  ┌────────────────────────┐    ┌─────────────────────────────┐  │
│  │   usePagePagination    │    │   useInfinitePagination     │  │
│  │   (Table)              │    │   (List, Gallery, Board)    │  │
│  └───────────┬────────────┘    └──────────────┬──────────────┘  │
│              │                                │                  │
│              └────────────┬───────────────────┘                  │
│                           ▼                                      │
│                    QueryBridge                                   │
│              (Orchestrates queries)                              │
│                           │                                      │
│              ┌────────────┴────────────┐                         │
│              ▼                         ▼                         │
│        useGroupQuery           useInfiniteGroupQuery             │
│        (Page mode)             (Infinite mode)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Hook Inputs

Both hooks accept a `queryOptionsFactory` pattern:

```typescript
// Standard views
queryOptionsFactory: (params) => trpc.product.getMany.queryOptions({
  filter: params.filter,
  sort: params.sort,
  limit: params.limit,
  cursor: params.cursor,       // For page pagination
  // or getNextPageParam      // For infinite pagination
})

// Board view
queryOptionsFactory: (params) => trpc.product.getManyByColumn.queryOptions({
  columnBy: columnConfig,
  filter: params.filter,
  sort: params.sort,
  limit: params.limit,
})
```

### Hook Outputs

```typescript
// usePagePagination
{
  pagination: {
    type: "page";
    queryOptionsFactory: PageQueryOptionsFactory;
    groupQueryOptionsFactory?: GroupQueryOptionsFactory;
  };
}

// useInfinitePagination
{
  pagination: {
    type: "infinite";
    queryOptionsFactory: InfiniteQueryOptionsFactory;
    groupQueryOptionsFactory?: GroupQueryOptionsFactory;
  };
}
```

### TanStack Query Hook Selection

| Mode | Metadata Hook | Item Hook |
|------|---------------|-----------|
| Flat + Page | None | `useSuspenseQuery` |
| Grouped + Page | `useSuspenseQuery` (`getGroup`) | `useSuspenseQuery` (per expanded group) |
| Flat + Infinite | None | `useSuspenseInfiniteQuery` |
| Grouped + Infinite | `useSuspenseQuery` (`getGroup`) | `useSuspenseInfiniteQuery` (per expanded group) |

Notes:
- `useQueries` can work for grouped page mode, but does not provide the same clean pattern for grouped infinite mode.
- For consistency, per-group child components should call the suspense hooks directly.

---

## Grouped Data Fetching

### Flat Query Pattern (Virtual Group)

Flat mode still renders through a virtual group (`"__ungrouped__"`), but fetches without group metadata:

1. Skip `getGroup`
2. Fetch one item stream/query (`getMany` or `getManyByColumn`)
3. Bind result to `"__ungrouped__"` for rendering + pagination controls

### Group Query Pattern

For grouped views, data is fetched per-group:

```
┌──────────────────────────────────────────────────────────────┐
│  Grouped Mode: Metadata + Per-Expanded-Group Queries          │
│                                                               │
│  Step 1: Get group keys + counts                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  trpc.product.getGroup({ groupBy: config })              │ │
│  │  → { counts: { Electronics: 45, Clothing: 32, ... } }    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Step 2: Fetch data for each expanded group                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  for each expandedGroup:                                 │ │
│  │    trpc.product.getMany({                                │ │
│  │      filter: combineGroupFilter(groupConfig, groupKey),  │ │
│  │      ...                                                 │ │
│  │    })                                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Result: Independent queries per group                        │
│  - Each group loads independently                             │
│  - Collapsed groups don't fetch (query not mounted)           │
│  - Expand triggers new fetch for that group only              │
└──────────────────────────────────────────────────────────────┘
```

### Board Group Pattern

Board follows the same N-query pattern but uses `getManyByColumn`:

```
┌──────────────────────────────────────────────────────────────┐
│  Board with Row Groups (Columns + Accordion Rows)             │
│                                                               │
│  Step 1: Get column counts                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  trpc.product.getGroup({ groupBy: columnConfig })        │ │
│  │  → Column headers with counts                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Step 2: Get row group counts (optional, for accordion)       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  trpc.product.getGroup({ groupBy: rowConfig })           │ │
│  │  → Row accordion headers with counts                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Step 3: Fetch data per row group                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  for each expandedRow:                                   │ │
│  │    trpc.product.getManyByColumn({                        │ │
│  │      columnBy: columnConfig,                             │ │
│  │      filter: combineGroupFilter(rowConfig, rowKey),      │ │
│  │      ...                                                 │ │
│  │    })                                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Suspense Strategy

### Goals

1. **Automatic loading states** via React Suspense
2. **No fallback flash** during filter/sort changes
3. **Decoupled modules** - view components don't manage loading logic

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Suspense Boundary Placement                                  │
│                                                               │
│  ┌─ App Layer (Demo Component) ─────────────────────────────┐│
│  │                                                           ││
│  │  <Suspense fallback={<ViewSkeleton />}>                   ││
│  │    <ModuleComponent />     ← Initial load shows skeleton  ││
│  │  </Suspense>                                              ││
│  │                                                           ││
│  └───────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ Module Layer ───────────────────────────────────────────┐│
│  │                                                           ││
│  │  DataViewProvider                                         ││
│  │    └── View Component                                     ││
│  │          └── <Suspense fallback={<GroupSkeleton />}>      ││
│  │                └── SuspendingGroupContent                 ││
│  │                      └── useSuspenseQuery()               ││
│  │                                                           ││
│  └───────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### Two-Layer Suspense

| Layer | Boundary | Fallback | Purpose |
|-------|----------|----------|---------|
| **Outer** (App) | Wraps entire module | Full view skeleton | Initial page load |
| **Inner** (View) | Per-group content | Group skeleton | Per-group loading |

### Smooth Transitions (No Fallback During Refetch)

In suspense mode, prefer deferred inputs + transitions to avoid fallback flash:

```
┌──────────────────────────────────────────────────────────────┐
│  User Action: Change Filter/Sort                              │
│                                                               │
│  WITHOUT deferred inputs:                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  1. Filter changes                                       │ │
│  │  2. Query key changes → data = undefined                 │ │
│  │  3. Suspense triggers → shows fallback skeleton          │ │
│  │  4. Data arrives → shows new data                        │ │
│  │                                                           │ │
│  │  Result: Jarring flash to skeleton                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  WITH deferred inputs + transitions:                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  1. Filter changes                                       │ │
│  │  2. Deferred params keep current query stable             │ │
│  │  3. UI continues showing previous content                 │ │
│  │  4. New data resolves in background                       │ │
│  │  5. UI swaps to new data without full fallback flash      │ │
│  │                                                           │ │
│  │  Result: Smooth transition, no skeleton flash             │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Implementation (suspense-first)**:

```typescript
const deferredFilter = useDeferredValue(filter);
const deferredSort = useDeferredValue(sort);
const deferredSearch = useDeferredValue(search);

const query = useSuspenseQuery(
  queryOptionsFactory({
    filter: deferredFilter,
    sort: deferredSort,
    search: deferredSearch,
  })
);
```

`keepPreviousData` remains useful for non-suspense query paths, but is not required for the suspense-first pattern.

---

## Module Decoupling

### Separation of Concerns

```
┌──────────────────────────────────────────────────────────────┐
│  Module Responsibilities (Decoupled)                          │
│                                                               │
│  ┌─ App Layer ──────────────────────────────────────────────┐│
│  │  - URL parameter parsing                                  ││
│  │  - Suspense boundary placement                            ││
│  │  - Skeleton component selection                           ││
│  └───────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ Module Layer ───────────────────────────────────────────┐│
│  │  - Hook initialization (usePagePagination, etc.)         ││
│  │  - Query options factory definition                       ││
│  │  - DataViewProvider setup                                 ││
│  │  - deferred/stale UI handling                             ││
│  └───────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ View Layer (dataview package) ──────────────────────────┐│
│  │  - Rendering logic (table, list, gallery, board)         ││
│  │  - Internal Suspense for per-group content                ││
│  │  - Pagination controls                                    ││
│  │  - No data fetching logic                                 ││
│  └───────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ Hook Layer (dataview package) ──────────────────────────┐│
│  │  - Query orchestration                                    ││
│  │  - URL state synchronization                              ││
│  │  - Cache management                                       ││
│  │  - Loading state computation                              ││
│  └───────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### What Each Layer Does NOT Know

| Layer | Does NOT know about |
|-------|---------------------|
| View | tRPC routes, URL parsers, data shape |
| Module | Suspense fallback UI, skeleton variants |
| Hook | Business logic, UI components |
| App | Internal query mechanics, caching |

---

## Data Flow Summary

```
┌──────────────────────────────────────────────────────────────┐
│  Complete Data Flow                                           │
│                                                               │
│  URL State (nuqs)                                             │
│    │                                                          │
│    ├── ?filter=... ──────────────────┐                        │
│    ├── ?sort=... ────────────────────┤                        │
│    ├── ?search=... ──────────────────┤                        │
│    ├── ?limit=25 ────────────────────┤                        │
│    ├── ?expanded=A,B ────────────────┤                        │
│    ├── ?cursors=after.894.25 ────────┤                        │
│    └── ?group=select.category ───────┤                        │
│                                      ▼                        │
│                          ┌─────────────────────┐              │
│                          │  Pagination Hook    │              │
│                          │  (URL → Query)      │              │
│                          └─────────┬───────────┘              │
│                                    │                          │
│                                    ▼                          │
│                          ┌─────────────────────┐              │
│                          │  TanStack Query     │              │
│                          │  (Cache + Fetch)    │              │
│                          └─────────┬───────────┘              │
│                                    │                          │
│                                    ▼                          │
│                          ┌─────────────────────┐              │
│                          │  tRPC Endpoint      │              │
│                          │  (Server)           │              │
│                          └─────────┬───────────┘              │
│                                    │                          │
│                                    ▼                          │
│                          ┌─────────────────────┐              │
│                          │  DataViewContext    │              │
│                          │  (React Context)    │              │
│                          └─────────┬───────────┘              │
│                                    │                          │
│                                    ▼                          │
│                          ┌─────────────────────┐              │
│                          │  View Component     │              │
│                          │  (Render)           │              │
│                          └─────────────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Why `getManyByColumn` for Board?

Board columns are a form of grouping but always present. Using a specialized endpoint:
- Reduces N+1 queries to 1 query for flat boards
- Returns consistent data shape (X items per column)
- Mirrors how grouped views work (N queries for N groups)

### 2. Why URL State for Pagination?

- **Shareable**: Links include full pagination state
- **Bookmarkable**: Return to exact position
- **History-aware**: Browser back/forward works
- **SSR-friendly**: Server can read initial state

### 3. Why Two Suspense Layers?

| Scenario | Outer Suspense | Inner Suspense |
|----------|---------------|----------------|
| Initial page load | Shows full skeleton | Not triggered |
| Expand new group | Not triggered | Shows group skeleton |
| Filter/sort change | Not triggered (deferred params) | Not triggered |

### 4. Why Virtual `__ungrouped__` in Flat Mode?

It unifies rendering and pagination controls across flat/grouped modes, making hybrid switching predictable without separate UI pipelines.

### 5. Why Separate Flat vs Grouped Fetch Plans?

Using one query plan for both modes either over-fetches in flat mode (unnecessary `getGroup`) or complicates grouped mode. Split plans keep flat mode fast and grouped mode explicit.

---

## Summary Table

| View | Flat Route | Grouped Route | Pagination Controller |
|------|------------|---------------|-----------------------|
| Table | `getMany` | `getGroup` + `getMany` (per expanded group) | `usePagePagination` |
| List | `getMany` | `getGroup` + `getMany` (per expanded group) | `useInfinitePagination` |
| Gallery | `getMany` | `getGroup` + `getMany` (per expanded group) | `useInfinitePagination` |
| Board | `getManyByColumn` | row `getGroup` + `getManyByColumn` (per expanded row group) | `useInfinitePagination` |

| Feature | Mechanism |
|---------|-----------|
| Initial loading | Outer Suspense boundary |
| Per-group loading | Inner Suspense boundary |
| Flat/group UI unification | Virtual group key: `"__ungrouped__"` |
| Smooth transitions | Deferred query params + React transitions |
| URL persistence | nuqs + custom parsers |
| Type safety | tRPC end-to-end types |
