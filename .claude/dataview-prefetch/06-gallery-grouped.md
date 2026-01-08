# Gallery View - Grouped Pagination

## Server (page.tsx)

```tsx
import { groupSearchParams } from "@ocean-dataview/shared/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/utils/trpc/server";

export default async function GroupedProductsGalleryPage({ searchParams }: PageProps) {
  const params = groupSearchParams.parse(await searchParams);
  const { expanded, limit, groupBy } = params;

  const queryClient = getQueryClient();

  // Prefetch group counts
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy })
  );

  // Loop prefetch all expanded groups
  for (const groupValue of expanded) {
    void queryClient.prefetchQuery(
      trpc.product.getMany.queryOptions({
        filters: [{ propertyId: groupBy, operator: "eq", value: groupValue }],
        limit,
        sort: [{ propertyId: "updatedAt", desc: false }],
      })
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductGroupGallery expanded={expanded} limit={limit} groupBy={groupBy} />
    </HydrationBoundary>
  );
}
```

## Client (product-group-gallery.tsx)

```tsx
"use client";

import { DataViewProvider } from "@ocean-dataview/dataview";
import { GalleryView } from "@ocean-dataview/dataview/components/gallery-view";
import { useGroupControls } from "@ocean-dataview/dataview/hooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";

interface ProductGroupGalleryProps {
  expanded: string[];
  limit: number;
  groupBy: string;
}

export function ProductGroupGallery({ expanded, limit, groupBy }: ProductGroupGalleryProps) {
  const trpc = useTRPC();

  // Query group counts
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy })
  );

  // Loop query all expanded groups
  const expandedData = expanded.map((groupValue) => {
    const { data } = useSuspenseQuery(
      trpc.product.getMany.queryOptions({
        filters: [{ propertyId: groupBy, operator: "eq", value: groupValue }],
        limit,
        sort: [{ propertyId: "updatedAt", desc: false }],
      })
    );
    return { groupKey: groupValue, items: data.items };
  });

  // Combine all items
  const allItems = expandedData.flatMap((group) => group.items);

  // URL setters
  const { toggleGroup } = useGroupControls({ expanded });

  return (
    <DataViewProvider data={allItems} properties={productProperties}>
      <GalleryView
        layout={{ columns: 4, gap: "md" }}
        group={{
          groupBy,
          counts: groupCounts,
          expandedGroups: expanded,
          onExpandedChange: toggleGroup,
        }}
      />
    </DataViewProvider>
  );
}
```
