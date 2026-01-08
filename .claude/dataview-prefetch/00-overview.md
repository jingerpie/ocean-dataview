# DataView Prefetch Pattern - Usage

## Flat Pagination

### Server (page.tsx)

```tsx
import { paginationSearchParams } from "@ocean-dataview/shared/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/utils/trpc/server";

export default async function PaginationPage({ searchParams }: PageProps) {
  const params = paginationSearchParams.parse(await searchParams);
  const { after, before, limit, start } = params;

  const queryClient = getQueryClient();

  // Prefetch with exact URL params
  void queryClient.prefetchQuery(
    trpc.product.getMany.queryOptions({
      after: after ?? undefined,
      before: before ?? undefined,
      limit,
      sort: [{ propertyId: "updatedAt", desc: true }],
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductTable after={after} before={before} limit={limit} start={start} />
    </HydrationBoundary>
  );
}
```

### Client (product-table.tsx)

```tsx
"use client";

interface ProductTableProps {
  after: string | null;
  before: string | null;
  limit: number;
  start: number;
}

export function ProductTable({ after, before, limit, start }: ProductTableProps) {
  const trpc = useTRPC();

  // Query with props - matches server prefetch
  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({
      after: after ?? undefined,
      before: before ?? undefined,
      limit,
      sort: [{ propertyId: "updatedAt", desc: true }],
    })
  );

  // URL setters only
  const { pagination } = usePaginationControls({
    limit,
    start,
    hasNext: data.hasNextPage,
    endCursor: data.endCursor,
    startCursor: data.startCursor,
  });

  return (
    <DataViewProvider data={data.items} properties={productProperties}>
      <TableView />
      <PagePagination {...pagination} />
    </DataViewProvider>
  );
}
```

---

## Grouped Pagination

### Server (page.tsx)

```tsx
import { groupSearchParams } from "@ocean-dataview/shared/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/utils/trpc/server";

export default async function GroupPaginationPage({ searchParams }: PageProps) {
  const params = groupSearchParams.parse(await searchParams);
  const { expanded, limit, groupBy } = params;

  const queryClient = getQueryClient();

  // 1. Prefetch group counts
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy })
  );

  // 2. Loop prefetch ALL expanded groups
  for (const groupValue of expanded) {
    void queryClient.prefetchQuery(
      trpc.product.getMany.queryOptions({
        filters: [{ propertyId: groupBy, operator: "eq", value: groupValue }],
        limit,
      })
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductGroupTable expanded={expanded} limit={limit} groupBy={groupBy} />
    </HydrationBoundary>
  );
}
```

### Client (product-group-table.tsx)

```tsx
"use client";

interface ProductGroupTableProps {
  expanded: string[];
  limit: number;
  groupBy: string;
}

export function ProductGroupTable({ expanded, limit, groupBy }: ProductGroupTableProps) {
  const trpc = useTRPC();

  // 1. Query group counts (matches server prefetch)
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy })
  );

  // 2. Loop query all expanded groups (matches server prefetch)
  const expandedData = expanded.map((groupValue) => {
    const { data } = useSuspenseQuery(
      trpc.product.getMany.queryOptions({
        filters: [{ propertyId: groupBy, operator: "eq", value: groupValue }],
        limit,
      })
    );
    return { groupKey: groupValue, items: data.items };
  });

  // 3. Combine all items
  const allItems = expandedData.flatMap((group) => group.items);

  // 4. URL setters only
  const { toggleGroup } = useGroupControls({ expanded });

  return (
    <DataViewProvider data={allItems} properties={productProperties}>
      <TableView
        group={{
          groupBy,
          counts: groupCounts,
          expandedGroups: expanded,
          onExpandedChange: toggleGroup,  // Updates URL, triggers page refresh
        }}
      />
    </DataViewProvider>
  );
}
```

---

## New Hooks (URL Setters Only)

### usePaginationControls

```tsx
export function usePaginationControls({ limit, start, hasNext, endCursor, startCursor }) {
  const [, setAfter] = useQueryState("after", parseAsString.withOptions({ shallow: false }));
  const [, setBefore] = useQueryState("before", parseAsString.withOptions({ shallow: false }));
  const [, setStart] = useQueryState("start", parseAsInteger.withOptions({ shallow: false }));
  const [, setLimit] = useQueryState("limit", parseAsInteger.withOptions({ shallow: false }));

  return {
    pagination: {
      limit,
      hasNext,
      hasPrev: start > 0,
      onNext: () => { setAfter(endCursor); setBefore(null); setStart(start + limit); },
      onPrev: () => { /* ... */ },
      onLimitChange: (newLimit) => { setLimit(newLimit); setAfter(null); setStart(0); },
    },
  };
}
```

### useGroupControls

```tsx
export function useGroupControls({ expanded }) {
  const [, setExpanded] = useQueryState(
    "expanded",
    parseAsArrayOf(parseAsString).withOptions({ shallow: false })
  );

  const toggleGroup = (groupKey: string) => {
    const newExpanded = expanded.includes(groupKey)
      ? expanded.filter((g) => g !== groupKey)
      : [...expanded, groupKey];
    setExpanded(newExpanded.length > 0 ? newExpanded : null);
  };

  return { toggleGroup };
}
```
