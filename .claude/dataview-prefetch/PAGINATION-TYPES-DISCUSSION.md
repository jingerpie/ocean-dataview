# Pagination Types Discussion

## The 3 Pagination Types

| Type | Behavior | Data Accumulation |
|------|----------|-------------------|
| **Page** | Replace data on each page | No - shows single page |
| **Load More** | Button click appends data | Yes - keeps all loaded |
| **Infinite Scroll** | Scroll triggers append | Yes - keeps all loaded |

## The Challenge

For **Page pagination**, the prefetch pattern works perfectly:
- URL: `?after=cursor123&limit=25`
- Server prefetches that exact page
- Client queries with same params, gets same data

For **Load More / Infinite Scroll**, we need to accumulate data:
- User has loaded pages 1, 2, 3
- All data should remain visible
- How do we prefetch AND accumulate?

---

## Option A: `useInfiniteQuery` (Recommended)

TanStack Query has built-in support for this via `useInfiniteQuery`.

### How It Works
- Server prefetches initial page only
- Client uses `useSuspenseInfiniteQuery`
- "Load more" calls `fetchNextPage()` - client-side fetch, no server round-trip
- Query automatically accumulates all pages

### Server (page.tsx)
```tsx
export default async function ProductsPage({ searchParams }: PageProps) {
  const params = paginationSearchParams.parse(await searchParams);
  const { limit } = params;  // Only need limit for initial

  const queryClient = getQueryClient();

  // Only prefetch first page
  void queryClient.prefetchInfiniteQuery(
    trpc.product.getMany.infiniteQueryOptions({
      limit,
      sort: [{ propertyId: "updatedAt", desc: true }],
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductList limit={limit} />
    </HydrationBoundary>
  );
}
```

### Client - Load More
```tsx
"use client";

export function ProductList({ limit }: { limit: number }) {
  const trpc = useTRPC();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    trpc.product.getMany.infiniteQueryOptions({
      limit,
      sort: [{ propertyId: "updatedAt", desc: true }],
    })
  );

  // Flatten all pages into single array
  const allItems = data.pages.flatMap((page) => page.items);

  return (
    <DataViewProvider data={allItems} properties={productProperties}>
      <ListView />
      <LoadMorePagination
        hasNext={hasNextPage}
        isLoading={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />
    </DataViewProvider>
  );
}
```

### Client - Infinite Scroll
```tsx
"use client";

export function ProductList({ limit }: { limit: number }) {
  const trpc = useTRPC();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    trpc.product.getMany.infiniteQueryOptions({
      limit,
      sort: [{ propertyId: "updatedAt", desc: true }],
    })
  );

  const allItems = data.pages.flatMap((page) => page.items);

  return (
    <DataViewProvider data={allItems} properties={productProperties}>
      <ListView />
      <InfiniteScrollPagination
        hasNext={hasNextPage}
        isLoading={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />
    </DataViewProvider>
  );
}
```

### Pros
- Built-in TanStack Query feature
- Automatic page accumulation
- Works with Suspense
- Client-side "load more" is fast (no server round-trip)
- No complex URL state

### Cons
- No server prefetch beyond first page
- "Load more" shows loading state (but this is expected UX)
- URL doesn't reflect scroll position (can't share "page 5" link)

---

## Option B: URL-Tracked Accumulation

Track loaded pages in URL, server prefetches all.

### URL Structure
```
?pages=1,2,3&limit=25
# OR
?loadedCursors=cursor1,cursor2,cursor3&limit=25
```

### Server
```tsx
export default async function ProductsPage({ searchParams }: PageProps) {
  const params = loadMoreSearchParams.parse(await searchParams);
  const { cursors, limit } = params;  // cursors = ["cursor1", "cursor2", ...]

  const queryClient = getQueryClient();

  // Prefetch ALL loaded pages
  for (const cursor of cursors) {
    void queryClient.prefetchQuery(
      trpc.product.getMany.queryOptions({
        after: cursor === "initial" ? undefined : cursor,
        limit,
      })
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductList cursors={cursors} limit={limit} />
    </HydrationBoundary>
  );
}
```

### Client
```tsx
"use client";

export function ProductList({ cursors, limit }: Props) {
  const trpc = useTRPC();
  const [, setCursors] = useQueryState("cursors", parseAsArrayOf(parseAsString));

  // Query all pages
  const pagesData = cursors.map((cursor) => {
    const { data } = useSuspenseQuery(
      trpc.product.getMany.queryOptions({
        after: cursor === "initial" ? undefined : cursor,
        limit,
      })
    );
    return data;
  });

  const allItems = pagesData.flatMap((page) => page.items);
  const lastPage = pagesData[pagesData.length - 1];

  const handleLoadMore = () => {
    if (lastPage?.endCursor) {
      setCursors([...cursors, lastPage.endCursor]);  // Triggers server prefetch
    }
  };

  return (
    <DataViewProvider data={allItems} properties={productProperties}>
      <ListView />
      <LoadMorePagination
        hasNext={lastPage?.hasNextPage}
        onLoadMore={handleLoadMore}
      />
    </DataViewProvider>
  );
}
```

### Pros
- Server prefetches ALL loaded pages on refresh
- URL is shareable (can share "loaded 3 pages" state)
- Consistent with page pagination pattern

### Cons
- URL grows large with many pages
- Server does more work on each navigation
- More complex implementation
- "Load more" triggers full page navigation (slower)

---

## Option C: Hybrid - First Page Prefetch + Client Accumulation

Server prefetches first page, client handles accumulation without URL.

### Server
```tsx
// Same as Option A - only prefetch first page
void queryClient.prefetchQuery(
  trpc.product.getMany.queryOptions({ limit })
);
```

### Client
```tsx
"use client";

export function ProductList({ limit }: { limit: number }) {
  const trpc = useTRPC();
  const [loadedPages, setLoadedPages] = useState<Array<{ cursor?: string }>>([{}]);

  // Query all loaded pages
  const pagesData = loadedPages.map(({ cursor }) => {
    const { data } = useSuspenseQuery(
      trpc.product.getMany.queryOptions({
        after: cursor,
        limit,
      })
    );
    return data;
  });

  const allItems = pagesData.flatMap((page) => page.items);
  const lastPage = pagesData[pagesData.length - 1];

  const handleLoadMore = () => {
    if (lastPage?.endCursor) {
      setLoadedPages([...loadedPages, { cursor: lastPage.endCursor }]);
    }
  };

  return (
    <DataViewProvider data={allItems} properties={productProperties}>
      <ListView />
      <LoadMorePagination
        hasNext={lastPage?.hasNextPage}
        onLoadMore={handleLoadMore}
      />
    </DataViewProvider>
  );
}
```

### Pros
- Simple URL (just limit)
- Fast "load more" (client-side)
- First page is prefetched

### Cons
- Refresh loses scroll position (back to page 1)
- Can't share deep links
- Manual state management

---

## Recommendation

| Pagination Type | Recommended Approach |
|-----------------|---------------------|
| **Page** | URL-driven prefetch (current plan) |
| **Load More** | Option A: `useInfiniteQuery` |
| **Infinite Scroll** | Option A: `useInfiniteQuery` |

### Reasoning

1. **Page pagination** benefits most from URL prefetch - users expect to share/bookmark specific pages

2. **Load More / Infinite Scroll** rarely need URL state for scroll position:
   - Users don't typically share "I scrolled to item 150"
   - `useInfiniteQuery` handles accumulation elegantly
   - Fast client-side fetching after initial load

3. If URL state IS needed for load more (rare), use Option B

---

## Component Design

The pagination components remain the same - they're just UI:

```tsx
// These components don't change - they receive handlers
<PagePagination onNext={...} onPrev={...} />
<LoadMorePagination onLoadMore={...} hasNext={...} />
<InfiniteScrollPagination onLoadMore={...} hasNext={...} />
```

The difference is in the hooks:

| Hook | Pagination Type | Data Source |
|------|-----------------|-------------|
| `usePaginationControls` | Page | URL state |
| `useInfiniteQuery` | Load More / Infinite | TanStack Query pages |

---

## tRPC Infinite Query Setup

For Option A, need to ensure tRPC procedure supports infinite queries:

```ts
// router.ts
export const productRouter = router({
  getMany: publicProcedure
    .input(getManyInput)
    .query(async ({ input }) => {
      const { after, before, limit, ...rest } = input;
      // ... fetch logic
      return {
        items,
        hasNextPage,
        hasPrevPage,
        endCursor,
        startCursor,
      };
    }),
});
```

```ts
// client usage
trpc.product.getMany.infiniteQueryOptions({
  limit: 25,
}, {
  getNextPageParam: (lastPage) => lastPage.endCursor,
  getPreviousPageParam: (firstPage) => firstPage.startCursor,
});
```
