# Server-Side Group Filtering

Group filtering is now handled server-side via `buildGroupWhere`, replacing the previous client-side `combineGroupFilter` approach.

## Problem

When grouped views (table, list, gallery, board) expanded a group, the client used `combineGroupFilter` to encode the group key as a simple `{ condition: "eq", value: groupKey }` filter rule. This caused 500 errors for:

- **Date groups** (week/month/year): Formatted strings like `"Aug 2025"` or `"Jul 28-Aug 03, 2025"` were compared literally against date columns
- **MultiSelect groups**: Scalar `=` was used instead of PostgreSQL `ANY()` for array columns
- **Relative date groups**: ISO timestamps matched only exact values, not date ranges

## Solution

Group filtering moved to the server. The `group` parameter (`{ groupBy, groupKey }`) is passed directly to `getMany` and `getManyByColumn`, where `buildGroupWhere` generates the correct SQL for each property type.

### Data Flow

```
Client (view)                    Server (tRPC)
─────────────                    ──────────────
params.group ──► getMany ──► buildGroupWhere(group.groupBy, group.groupKey)
  { groupBy,       input        │
    groupKey }                   ├─ date:        TO_CHAR(...) = groupKey
                                 ├─ multiSelect: groupKey = ANY(column)
                                 ├─ checkbox:    column = true/false
                                 ├─ number:      range WHERE clauses
                                 ├─ text:        SUBSTR / exact match
                                 └─ status:      IN (options...) for groups
```

### API Shape

```typescript
// getMany and getManyByColumn accept an optional group parameter
trpc.product.getMany.queryOptions({
  filter: params.filter,
  group: params.group ?? undefined,  // { groupBy: GroupByConfig, groupKey: string }
  sort: params.sort,
  limit: params.limit,
});
```

### Type Chain

```
GroupFilter                      → { groupBy: GroupConfigInput, groupKey: string }
PageQueryOptionsFactoryParams    → { group: GroupFilter | null, ... }
InfiniteQueryOptionsFactoryParams → { group: GroupFilter | null, ... }
getManyInput (Zod)               → { group: { groupBy, groupKey }?, ... }
getManyByColumnInput (Zod)       → { group: { groupBy, groupKey }?, ... }
```

### Key Files

| File | Role |
|------|------|
| `packages/trpc/src/lib/build-group.ts` | `buildGroupWhere` — accepts `GroupByConfig \| ParsedGroupConfig`, generates SQL |
| `packages/trpc/src/lib/schemas.ts` | `groupSchema` — Zod schema for `{ groupBy, groupKey }` |
| `packages/trpc/src/routers/product.ts` | `getMany` / `getManyByColumn` — calls `buildGroupWhere` when `group` is present |
| `packages/dataview/src/types/pagination-controller.ts` | `GroupFilter` type, factory param types |
| `packages/dataview/src/hooks/use-group-query.ts` | Constructs `group` from controller state |
| `packages/dataview/src/hooks/use-infinite-group-query.ts` | Constructs `group` from controller state |

### What Was Removed

- `combineGroupFilter` — deleted (`packages/dataview/src/utils/group-filter.ts`)
- Client-side group-to-filter encoding — no longer needed
