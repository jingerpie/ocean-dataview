# Table View - Flat Pagination

## Server (page.tsx)

```tsx
import { paginationSearchParams } from "@ocean-dataview/shared/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/utils/trpc/server";

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = paginationSearchParams.parse(await searchParams);
  const { after, before, limit, start } = params;

  const queryClient = getQueryClient();

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

## Client (product-table.tsx)

```tsx
"use client";

import { DataViewProvider } from "@ocean-dataview/dataview";
import { TableView } from "@ocean-dataview/dataview/components/table-view";
import { PagePagination } from "@ocean-dataview/dataview/components/pagination";
import { usePaginationControls } from "@ocean-dataview/dataview/hooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";

interface ProductTableProps {
  after: string | null;
  before: string | null;
  limit: number;
  start: number;
}

export function ProductTable({ after, before, limit, start }: ProductTableProps) {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({
      after: after ?? undefined,
      before: before ?? undefined,
      limit,
      sort: [{ propertyId: "updatedAt", desc: true }],
    })
  );

  const { pagination } = usePaginationControls({
    limit,
    start,
    hasNext: data.hasNextPage,
    endCursor: data.endCursor,
    startCursor: data.startCursor,
  });

  return (
    <DataViewProvider data={data.items} properties={productProperties}>
      <TableView layout={{ showVerticalLines: false, stickyHeader: true }} />
      <PagePagination {...pagination} />
    </DataViewProvider>
  );
}
```
