# Rules of Hooks Violation in Group Pagination

## Problem

When expanding a group on `/group-pagination`, React throws:

```
React has detected a change in the order of Hooks called by ProductGroupPaginationTableView.
```

## Root Cause

The refactored code loops over `expanded` array and calls `useSuspenseQuery` inside `.map()`:

```tsx
// PROBLEM: Number of useSuspenseQuery calls changes when expanded changes!
const expandedData = expanded.map((groupValue) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({...}),
  );
  return { groupKey: groupValue, items: data.items as Product[] };
});
```

When `expanded` changes from `[]` to `["Electronics"]`:
- **Before:** 0 `useSuspenseQuery` calls
- **After:** 1 `useSuspenseQuery` call

This violates React's Rules of Hooks: hooks must be called in the same order (and same count) on every render.

The `eslint-disable` comment hid this during static analysis, but the runtime error surfaces when the component re-renders.

---

## Solution: useQueries with enabled flags ✅

**For grouped pagination, we prefetch only the group counts summary on the server. On the client, we use `useQueries` with `enabled` flags to lazily fetch expanded groups — this avoids the hooks order violation while maintaining per-group pagination capability, at the cost of no Suspense (we show loading spinners per-group instead).**

### Architecture

```
Server (page.tsx):
  └── Prefetch group counts only (lightweight)
      └── void queryClient.prefetchQuery(trpc.product.getGroup.queryOptions(...))

Client (component.tsx):
  └── useSuspenseQuery for group counts (Suspense OK - always 1 query)
  └── useQueries for group items (no Suspense - use enabled flag)
      └── Query for EVERY group key from counts
      └── enabled: expanded.includes(groupKey)
      └── Disabled queries don't fetch, just occupy a "slot"
```

### Why This Works

```tsx
const groupKeys = Object.keys(groupCounts ?? {});  // e.g., ["Electronics", "Clothing", "Home"]

// Always N queries (one per group), but only enabled ones fetch
const queries = useQueries({
  queries: groupKeys.map((groupKey) => ({
    ...trpc.product.getMany.queryOptions({...}),
    enabled: expanded.includes(groupKey),  // Only fetch if expanded
  })),
});
```

| expanded state | Hook count | Fetches |
|----------------|------------|---------|
| `[]` | 3 | 0 |
| `["Electronics"]` | 3 | 1 |
| `["Electronics", "Clothing"]` | 3 | 2 |

**Hook count stays constant = no Rules of Hooks violation**

### Trade-offs

| Aspect | Before (useSuspenseQuery loop) | After (useQueries + enabled) |
|--------|-------------------------------|------------------------------|
| Hook count | Variable ❌ | Constant ✅ |
| Suspense for items | Yes (broken) | No (loading spinners) |
| Per-group pagination | Possible | Possible ✅ |
| Server prefetch | Items for expanded groups | Counts only |
| Initial load | Shows prefetched items | Shows collapsed groups, loads on expand |

### Loading State

Since we can't use Suspense for dynamic queries, each group shows its own loading state:

```tsx
const query = queries[index];
const isLoading = query?.isLoading ?? false;
const items = (query?.data?.items ?? []) as Product[];

// In pagination object:
{
  key: groupKey,
  isLoading,  // TableView uses this to show spinner
  items,
  // ...
}
```

---

## Alternatives Considered (and why not)

### ❌ useSuspenseQueries
- Doesn't support `enabled` flag - all queries execute immediately
- Would fetch ALL groups on initial load, defeating lazy loading

### ❌ Single query with IN/OR condition
- Can't do per-group pagination (each group needs independent cursor state)
- Would need client-side grouping of mixed results

### ❌ Separate child components per group
- Major refactor of view structure
- Doesn't work well with DataViewProvider pattern (needs all data upfront)

### ❌ Reuse useGroupPagination hook
- More opinionated (manages its own URL state for cursors)
- May conflict with the URL-driven server prefetch pattern

---

## Implementation Plan

### Server (page.tsx)
```tsx
// Only prefetch group counts - lightweight, always needed
void queryClient.prefetchQuery(
  trpc.product.getGroup.queryOptions({ groupBy: GROUP_BY }),
);
// Do NOT prefetch expanded group items - let client handle lazily
```

### Client (component.tsx)
```tsx
// 1. Group counts - use Suspense (always 1 query)
const { data: groupCounts } = useSuspenseQuery(
  trpc.product.getGroup.queryOptions({ groupBy: GROUP_BY }),
);

// 2. Group items - use useQueries with enabled flag (constant N queries)
const groupKeys = Object.keys(groupCounts ?? {});

const queries = useQueries({
  queries: groupKeys.map((groupKey) => ({
    ...trpc.product.getMany.queryOptions({
      filters: [{ propertyId: GROUP_BY, operator: "eq", value: groupKey, ... }],
      limit,
    }),
    enabled: expanded.includes(groupKey),
    staleTime: 30_000,
  })),
});

// 3. Build pagination object with loading states
const pagination = useMemo(() => {
  const groups = groupKeys.map((key, index) => {
    const query = queries[index];
    return {
      key,
      value: key,
      count: groupCounts[key]?.count ?? 0,
      hasMore: groupCounts[key]?.hasMore ?? false,
      isLoading: query?.isLoading ?? false,
      items: (query?.data?.items ?? []) as Product[],
      // ... pagination controls
    };
  });
  return { groups, limit, ... };
}, [groupKeys, queries, groupCounts, limit]);
```

### Files to Update
1. `apps/web/src/app/group-pagination/page.tsx` - Remove expanded group prefetches
2. `apps/web/src/modules/group-pagination/product-group-pagination-table.tsx`
3. `apps/web/src/modules/group-pagination/product-group-pagination-list.tsx`
4. `apps/web/src/modules/group-pagination/product-group-pagination-gallery.tsx`

---

## ✅ IMPLEMENTED

All files updated. Typecheck and lint passed.

**Changes made:**
- Server now only prefetches group counts (removed expanded group prefetches)
- Client uses `useQueries` with `enabled` flags for lazy loading per-group
- Hook count stays constant regardless of `expanded` state
- Each group shows `isLoading` state while fetching
