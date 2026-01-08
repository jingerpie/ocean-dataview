# Board View (Kanban)

Board view displays data in columns grouped by a property (e.g., status). Each column shows items for that group.

## Server (page.tsx)

```tsx
import { groupSearchParams } from "@ocean-dataview/shared/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/utils/trpc/server";

export default async function ProductsBoardPage({ searchParams }: PageProps) {
  const params = groupSearchParams.parse(await searchParams);
  const { expanded, limit, groupBy } = params;

  const queryClient = getQueryClient();

  // Prefetch group counts
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy })
  );

  // Loop prefetch all expanded groups (columns)
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
      <ProductBoard expanded={expanded} limit={limit} groupBy={groupBy} />
    </HydrationBoundary>
  );
}
```

## Client (product-board.tsx)

```tsx
"use client";

import { DataViewProvider } from "@ocean-dataview/dataview";
import { BoardView } from "@ocean-dataview/dataview/components/board-view";
import { useGroupControls } from "@ocean-dataview/dataview/hooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";

interface ProductBoardProps {
  expanded: string[];
  limit: number;
  groupBy: string;
}

export function ProductBoard({ expanded, limit, groupBy }: ProductBoardProps) {
  const trpc = useTRPC();

  // Query group counts
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy })
  );

  // Loop query all expanded groups (columns)
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
      <BoardView
        groupBy={groupBy}
        counts={groupCounts}
        expandedGroups={expanded}
        onExpandedChange={toggleGroup}
        layout={{
          columnWidth: 320,
          gap: "md",
        }}
      />
    </DataViewProvider>
  );
}
```

