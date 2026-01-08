# Simplified Prefetch Plan

## Goal

Single source of truth: Server parses URL → passes as props → Client uses props for query.

---

## Turboitem Pattern (Reference)

```
Server (page.tsx)
  ├── Parse URL params
  ├── Prefetch with params
  └── Pass searchParams to client

Client View (view.tsx)
  ├── Parse searchParams (same parser)
  └── Pass as PROPS to component

Client Component (table.tsx)
  ├── Receives props: { page, pageSize, ... }
  ├── useSuspenseQuery(queryOptions(props))  ← uses props directly
  └── useDataTable handles URL UPDATES only (setters with shallow: false)
```

**Key: Component receives props, doesn't read URL internally**

---

## Plan for Ocean-DataView

### 1. Flat Pagination

**Server (`page.tsx`):**
```tsx
export default async function PaginationPage({ searchParams }: PageProps) {
  const params = await flatPaginationParams.parse(searchParams);
  const { after, before, limit, start } = params;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.product.getMany.queryOptions({
      after: after ?? undefined,
      before: before ?? undefined,
      limit,
      sort: [{ propertyId: "updatedAt", desc: true }],
    }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductPaginationTable
        after={after}
        before={before}
        limit={limit}
        start={start}
      />
    </HydrationBoundary>
  );
}
```

**Client Component:**
```tsx
interface Props {
  after: string | null;
  before: string | null;
  limit: number;
  start: number;
}

// Wrapper with Suspense
export const ProductPaginationTable = (props: Props) => (
  <Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
    <ProductPaginationTableView {...props} />
  </Suspense>
);

const ProductPaginationTableView = ({ after, before, limit, start }: Props) => {
  const trpc = useTRPC();

  // Query with props (matches server prefetch)
  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({
      after: after ?? undefined,
      before: before ?? undefined,
      limit,
      sort: [{ propertyId: "updatedAt", desc: true }],
    }),
  );

  return (
    <DataViewProvider data={data.items} properties={productProperties}>
      <TableView pagination="page|loadMore|infiniteScroll" />
    </DataViewProvider>
  );
};
```

### 2. Group Pagination

**Server (`page.tsx`):**
```tsx
export default async function GroupPaginationPage({ searchParams }: PageProps) {
  const params = await groupPaginationParams.parse(searchParams);
  const { expanded, limit } = params;

  const queryClient = getQueryClient();

  // Prefetch group counts only
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductGroupPaginationTable expanded={expanded} limit={limit} />
    </HydrationBoundary>
  );
}
```

**Client Component (using `useQueries` + `useGroupData` hook):**
```tsx
const DEFAULT_EXPANDED: string[] = [];  // Default on client

interface Props {
  expanded: string[] | null;  // null when no URL param
  limit: number;
}

// Wrapper with Suspense (only for group counts)
export const ProductGroupPaginationTable = (props: Props) => (
  <Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
    <ProductGroupPaginationTableView {...props} />
  </Suspense>
);

const ProductGroupPaginationTableView = ({ expanded: expandedProp, limit }: Props) => {
  const trpc = useTRPC();

  // 1. Group counts (Suspense OK - matches server prefetch)
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy: "familyGroup" }),
  );

  // 2. Apply default on client
  const expanded = expandedProp ?? DEFAULT_EXPANDED;

  // 3. Get all group keys (stable order)
  const allGroupKeys = Object.keys(groupCounts);

  // 4. useQueries with enabled flag - queries for ALL groups, only enabled for expanded
  //    This keeps hook count constant (no Rules of Hooks violation)
  const groupQueries = useQueries({
    queries: allGroupKeys.map((groupKey) => ({
      ...trpc.product.getMany.queryOptions({
        filters: [
          {
            propertyId: "familyGroup",
            operator: "eq",
            value: groupKey,
            variant: "select",
            filterId: "familyGroup-group",
          },
        ],
        sort: [{ propertyId: "updatedAt", desc: false }],
        limit,
      }),
      enabled: expanded.includes(groupKey),  // Only fetch expanded groups
    })),
  });

  // 5. useGroupData hook - builds data + pagination + URL handlers
  const { data, pagination, handleAccordionChange } = useGroupData({
    groupQueries,
    allGroupKeys,
    expanded,
    groupCounts,
    groupBy: "familyGroup",
  });

  return (
    <DataViewProvider data={data} properties={productProperties} pagination={pagination}>
      <TableView
        view={{
          group: {
            groupBy: "familyGroup",
            expandedGroups: expanded,
            onExpandedChange: handleAccordionChange,
          },
        }}
      />
    </DataViewProvider>
  );
};
```

**`useGroupData` hook (reusable across group dataviews):**
```tsx
interface UseGroupDataInput<TData> {
  groupQueries: UseQueryResult<QueryResult<TData>>[];  // Result from useQueries
  allGroupKeys: string[];
  expanded: string[];
  groupCounts: Record<string, number>;
  groupBy: string;
}

interface UseGroupDataOutput<TData> {
  data: TData[];
  pagination: GroupPaginationState;
  handleAccordionChange: (groups: string[]) => void;
}

function useGroupData<TData>(input: UseGroupDataInput<TData>): UseGroupDataOutput<TData> {
  const { groupQueries, allGroupKeys, expanded, groupCounts, groupBy } = input;

  // Build flattened data from query results
  const data = useMemo(() => {
    return allGroupKeys.flatMap((groupKey, index) => {
      const query = groupQueries[index];
      if (!expanded.includes(groupKey)) return [];
      return query.data?.items ?? [];
    });
  }, [allGroupKeys, groupQueries, expanded]);

  // Build pagination state
  const pagination = useMemo(() => {
    const groups = allGroupKeys.map((groupKey, index) => {
      const query = groupQueries[index];
      const isExpanded = expanded.includes(groupKey);
      return {
        key: groupKey,
        count: groupCounts[groupKey] ?? 0,
        isLoading: isExpanded && query.isLoading,
        hasNext: query.data?.hasNextPage ?? false,
        hasPrev: query.data?.hasPreviousPage ?? false,
      };
    });
    return { groups, groupBy };
  }, [allGroupKeys, groupQueries, expanded, groupCounts, groupBy]);

  // URL setter for accordion changes (shallow: false triggers server re-render)
  const [, setExpanded] = useQueryState(
    "expanded",
    parseAsExpanded.withOptions({ shallow: false }),
  );

  const handleAccordionChange = useCallback((groups: string[]) => {
    // Find which group was toggled
    const added = groups.find((g) => !expanded.includes(g));
    const removed = expanded.find((g) => !groups.includes(g));
    const changedGroup = added ?? removed;

    if (changedGroup) {
      const newExpanded = added
        ? [...expanded, changedGroup]
        : expanded.filter((g) => g !== changedGroup);
      setExpanded(newExpanded.length > 0 ? newExpanded : null);
    }
  }, [expanded, setExpanded]);

  return { data, pagination, handleAccordionChange };
}
```

**Key points:**
- `useQueries` with `enabled` flag keeps hook count constant (queries ALL groups, enables only expanded)
- `useGroupData` hook is reusable - accepts query results, returns `data` + `pagination` + `handleAccordionChange`
- No internal URL reading - `expanded` comes from props
- `handleAccordionChange` updates URL with `shallow: false` (triggers server re-render)
- No Suspense for group data (uses loading spinners per-group instead)

---

## Key Differences from Current

| Aspect | Current (`usePagination`) | New Pattern |
|--------|---------------------------|-------------|
| URL reading | Hook reads internally | Server passes as props |
| Query params | From hook's URL state | From props |
| Source of truth | URL (read by hook) | Props (from server) |
| Hook purpose | Read URL + fetch + update | Update URL only |

---

## Files to Update

### Flat Pagination
1. Create `flatPaginationParams` parser
2. Update `page.tsx` - parse URL, prefetch, pass props
3. Update client components - receive props, use for query
4. Create/update `usePaginationControls` - URL setters only

### Group Pagination
1. Update `page.tsx` - pass `expanded`, `limit` as props
2. Create `useGroupData` hook (reusable):
   - Accepts `groupQueries`, `allGroupKeys`, `expanded`, `groupCounts`, `groupBy`
   - Returns `data`, `pagination`, `handleAccordionChange`
3. Update client components:
   - Receive props (no URL reading)
   - Use `useSuspenseQuery` for group counts (matches server prefetch)
   - Use `useQueries` with `enabled` flag for group data
   - Use `useGroupData` for everything else

---

## URL Param Schema Note

There's a mismatch in URL param formats:

| Hook | URL Params |
|------|------------|
| `usePagination` | `after`, `before`, `limit`, `start` |
| `useGroupPagination` | `cursors`, `limit` |
| `useGroupExpansion` | `expanded` |
| `productSearchParamsType` | `cursors`, `limit`, `expanded`, `filters`, `sort` |

For flat pagination, need a simple parser for `after`, `before`, `limit`, `start`.

---

## Implementation Checklist

### Flat Pagination
- [ ] Create simple `flatPaginationParams` parser with `after`, `before`, `limit`, `start`
- [ ] Update `/pagination/page.tsx` to:
  - Parse URL with `flatPaginationParams`
  - Prefetch with same query options as client
  - Wrap with `HydrationBoundary`
- [ ] Verify cache hit on initial load

### Group Pagination
- [x] Server prefetches group counts (already done)
- [ ] Create `useGroupData` hook:
  - Accepts `groupQueries`, `allGroupKeys`, `expanded`, `groupCounts`, `groupBy`
  - Returns `data`, `pagination`, `handleAccordionChange`
- [ ] Update client components:
  - Receive `expanded`, `limit` as props
  - Use `useQueries` with `enabled` flag
  - Use `useGroupData` for `data`, `pagination`, `handleAccordionChange`
- [ ] Verify no hooks order violation on expand/collapse
