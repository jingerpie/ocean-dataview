# DataView Architecture

This document describes the four DataView types and their tRPC route usage patterns.

## Overview

DataView provides four view types for displaying data:

| View | Description | Pagination |
|------|-------------|------------|
| **Table** | Traditional tabular data with rows and columns | Page-based |
| **List** | Vertical list of items | Infinite scroll |
| **Gallery** | Grid of cards with media previews | Infinite scroll |
| **Board** | Kanban-style columns | Infinite scroll (per-column) |

Each view type has three variants:

| Variant | Description |
|---------|-------------|
| **Flat** | No grouping - displays all items in a single list/grid |
| **Group** | Predefined accordion grouping - items organized in collapsible sections |
| **Hybrid** | Configurable grouping via toolbar - user can toggle grouping on/off |

## tRPC Routes

### `product.getMany`

Fetches paginated items with filtering, sorting, and search.

**Used by:** Table, List, Gallery (all variants)

```typescript
trpc.product.getMany.queryOptions({
  filter: WhereNode[],
  sort: SortQuery[],
  search: SearchQuery,
  limit: number,
  cursor: string,        // Page pagination
  cursors: Record<string, string>,  // Group pagination
})
```

### `product.getManyByColumn`

Fetches items grouped by column with per-column pagination. Returns all columns in a single query.

**Used by:** Board (all variants)

```typescript
trpc.product.getManyByColumn.infiniteQueryOptions({
  columnBy: GroupByConfig,  // Column grouping config
  filter: WhereNode[],
  sort: SortQuery[],
  search: SearchQuery,
  limit: number,
  cursor: Record<string, string>,  // Per-column cursors
})
```

### `product.getGroup`

Fetches group counts for accordion sections or board columns.

**Used by:** All grouped/hybrid variants

```typescript
trpc.product.getGroup.queryOptions({
  groupBy: GroupByConfig,
})
```

## View Type Details

### Table

Page-based pagination with optional accordion grouping.

| Variant | Data Route | Group Counts | Pagination |
|---------|-----------|--------------|------------|
| Flat | `getMany` | - | `usePagePagination` |
| Group | `getMany` | `getGroup` (via factory) | `usePagePagination` |
| Hybrid | `getMany` | `getGroup` (via factory) | `usePagePagination` |

### List

Infinite scroll pagination with optional accordion grouping.

| Variant | Data Route | Group Counts | Pagination |
|---------|-----------|--------------|------------|
| Flat | `getMany` | - | `useInfinitePagination` |
| Group | `getMany` | `getGroup` (via factory) | `useInfinitePagination` |
| Hybrid | `getMany` | `getGroup` (via factory) | `useInfinitePagination` |

### Gallery

Infinite scroll pagination with optional accordion grouping.

| Variant | Data Route | Group Counts | Pagination |
|---------|-----------|--------------|------------|
| Flat | `getMany` | - | `useInfinitePagination` |
| Group | `getMany` | `getGroup` (via factory) | `useInfinitePagination` |
| Hybrid | `getMany` | `getGroup` (via factory) | `useInfinitePagination` |

### Board

Kanban-style columns with per-column infinite scroll. Board has two grouping concepts:

- **Column**: Visual kanban columns (always present)
- **Group**: Accordion rows within columns (optional)

| Variant | Data Route | Column Counts | Accordion Counts | Pagination |
|---------|-----------|---------------|------------------|------------|
| Flat | `getManyByColumn` | `getGroup` (separate query) | - | `useInfinitePagination` |
| Group | `getManyByColumn` | `getGroup` (separate query) | `getGroup` (via factory) | `useInfinitePagination` |
| Hybrid | `getManyByColumn` | `getGroup` (separate query) | `getGroup` (via factory, conditional) | `useInfinitePagination` |

## Architecture Patterns

### Standard Views (Table, List, Gallery)

```
┌─────────────────────────────────────────────────────┐
│                  DataViewProvider                    │
│  ┌───────────────────────────────────────────────┐  │
│  │              QueryBridge                       │  │
│  │  ┌─────────────────┐  ┌────────────────────┐  │  │
│  │  │ groupQueryOpts  │  │ queryOptionsFactory│  │  │
│  │  │ (accordion)     │  │ (data items)       │  │  │
│  │  └────────┬────────┘  └─────────┬──────────┘  │  │
│  │           │                     │              │  │
│  │           ▼                     ▼              │  │
│  │    getGroup API           getMany API          │  │
│  │    (counts)               (items)              │  │
│  └───────────────────────────────────────────────┘  │
│                        │                             │
│                        ▼                             │
│               TableView / ListView / GalleryView     │
└─────────────────────────────────────────────────────┘
```

### Board View

Board has a separate flow for column counts because columns are always present (not optional like accordion grouping).

```
┌─────────────────────────────────────────────────────┐
│                  Board Component                     │
│                                                      │
│  ┌────────────────┐                                  │
│  │ useQuery       │ ◄── Separate query for          │
│  │ (columnCounts) │     column counts                │
│  └───────┬────────┘                                  │
│          │                                           │
│          ▼                                           │
│  ┌───────────────────────────────────────────────┐  │
│  │              DataViewProvider                  │  │
│  │         columnCounts={...}                     │  │
│  │  ┌───────────────────────────────────────────┐│  │
│  │  │              QueryBridge                   ││  │
│  │  │  ┌─────────────────┐  ┌────────────────┐  ││  │
│  │  │  │ groupQueryOpts  │  │ queryOptsFact  │  ││  │
│  │  │  │ (accordion rows)│  │ (column data)  │  ││  │
│  │  │  └────────┬────────┘  └───────┬────────┘  ││  │
│  │  │           │                   │            ││  │
│  │  │           ▼                   ▼            ││  │
│  │  │    getGroup API      getManyByColumn API   ││  │
│  │  │    (row counts)      (all column items)    ││  │
│  │  └───────────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────┘  │
│                        │                             │
│                        ▼                             │
│                    BoardView                         │
└─────────────────────────────────────────────────────┘
```

## Code Examples

### Flat Table (Page Pagination, No Grouping)

```typescript
const { pagination } = usePagePagination({
  queryOptionsFactory: (params) =>
    trpc.product.getMany.queryOptions({
      filter: params.filter,
      sort: params.sort,
      limit: params.limit,
      cursors: params.cursors,
    }),
});

return (
  <DataViewProvider
    defaults={{ filter, sort, limit }}
    pagination={pagination}
    properties={properties}
  >
    <TableView />
  </DataViewProvider>
);
```

### Group List (Infinite Scroll, Accordion Grouping)

```typescript
const { pagination } = useInfinitePagination({
  // Provides accordion group counts
  groupQueryOptionsFactory: (groupConfig) =>
    trpc.product.getGroup.queryOptions({ groupBy: groupConfig }),

  // Fetches items per accordion section
  queryOptionsFactory: (params) =>
    trpc.product.getMany.infiniteQueryOptions({
      filter: combineGroupFilter(params.groupConfig, params.groupKey, params.filter),
      sort: params.sort,
      limit: params.limit,
    }),
});

return (
  <DataViewProvider
    defaults={{ filter, sort, limit, group: groupConfig }}
    pagination={pagination}
    properties={properties}
  >
    <ListView />
  </DataViewProvider>
);
```

### Flat Board (Columns Only, No Accordion)

```typescript
// Fetch column counts separately
const columnCountsQuery = useQuery(
  trpc.product.getGroup.queryOptions({ groupBy: columnConfig })
);

const { pagination } = useInfinitePagination({
  // No groupQueryOptionsFactory - no accordion rows
  queryOptionsFactory: (params) =>
    trpc.product.getManyByColumn.infiniteQueryOptions({
      columnBy: columnConfig,
      filter: params.filter,
      sort: params.sort,
      limit: params.limit,
    }),
});

return (
  <DataViewProvider
    columnCounts={columnCountsQuery.data?.counts}
    defaults={{ filter, sort, limit, column: columnConfig }}
    pagination={pagination}
    properties={properties}
  >
    <BoardView />
  </DataViewProvider>
);
```

### Group Board (Columns + Accordion Rows)

```typescript
// Fetch column counts separately
const columnCountsQuery = useQuery(
  trpc.product.getGroup.queryOptions({ groupBy: columnConfig })
);

const { pagination } = useInfinitePagination({
  // Provides accordion row counts
  groupQueryOptionsFactory: (groupConfig) =>
    trpc.product.getGroup.queryOptions({ groupBy: groupConfig }),

  // Fetches all columns in one query
  queryOptionsFactory: (params) =>
    trpc.product.getManyByColumn.infiniteQueryOptions({
      columnBy: columnConfig,
      filter: params.filter,
      sort: params.sort,
      limit: params.limit,
    }),
});

return (
  <DataViewProvider
    columnCounts={columnCountsQuery.data?.counts}
    defaults={{
      filter, sort, limit,
      column: columnConfig,  // Board columns
      group: rowGroupConfig, // Accordion rows
    }}
    pagination={pagination}
    properties={properties}
  >
    <BoardView />
  </DataViewProvider>
);
```

## Key Concepts

### `groupQueryOptionsFactory`

A factory function that creates query options for fetching group counts. Used by QueryBridge to:
1. Determine which accordion groups exist
2. Fetch counts for each group
3. Enable per-group data fetching

Only needed when accordion grouping is enabled.

### `columnCounts` Prop

Board-specific prop that provides column counts directly to DataViewProvider. Fetched via a separate `useQuery` call because:
1. Columns are always present for boards (not optional like accordion)
2. Decouples column display from accordion grouping logic
3. Allows BoardView to render columns immediately

### QueryBridge

Internal component that orchestrates:
1. URL state management (filter, sort, search, group, expanded)
2. Group count fetching via `groupQueryOptionsFactory`
3. Data fetching via `queryOptionsFactory`
4. Aggregating results for DataViewProvider
