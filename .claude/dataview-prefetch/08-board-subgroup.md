# Board View - With Subgroups

Board grouped by `familyGroup` (columns), with subgroups by `status` within each column.

## Server (page.tsx)

```tsx
import { subgroupSearchParams } from "@ocean-dataview/shared/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/utils/trpc/server";

export default async function ProductsSubgroupBoardPage({ searchParams }: PageProps) {
  const params = subgroupSearchParams.parse(await searchParams);
  const { expanded, expandedSubgroups, limit, groupBy, subGroupBy } = params;

  const queryClient = getQueryClient();

  // 1. Prefetch group counts (columns)
  void queryClient.prefetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy })
  );

  // 2. Prefetch subgroup counts for each expanded group
  for (const groupValue of expanded) {
    void queryClient.prefetchQuery(
      trpc.product.getSubGroup.queryOptions({
        groupBy,
        groupValue,
        subGroupBy,
      })
    );
  }

  // 3. Prefetch items for each expanded subgroup
  // expandedSubgroups format: ["groupValue:subgroupValue", ...]
  for (const subgroupKey of expandedSubgroups) {
    const [groupValue, subgroupValue] = subgroupKey.split(":");
    void queryClient.prefetchQuery(
      trpc.product.getMany.queryOptions({
        filters: [
          { propertyId: groupBy, operator: "eq", value: groupValue },
          { propertyId: subGroupBy, operator: "eq", value: subgroupValue },
        ],
        limit,
      })
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductSubgroupBoard
        expanded={expanded}
        expandedSubgroups={expandedSubgroups}
        limit={limit}
        groupBy={groupBy}
        subGroupBy={subGroupBy}
      />
    </HydrationBoundary>
  );
}
```

## Client (product-subgroup-board.tsx)

```tsx
"use client";

import { DataViewProvider } from "@ocean-dataview/dataview";
import { BoardView } from "@ocean-dataview/dataview/components/board-view";
import { useSubgroupControls } from "@ocean-dataview/dataview/hooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc/client";
import { productProperties } from "./product-properties";

interface ProductSubgroupBoardProps {
  expanded: string[];           // Expanded columns (groups)
  expandedSubgroups: string[];  // Expanded subgroups "groupValue:subgroupValue"
  limit: number;
  groupBy: string;
  subGroupBy: string;
}

export function ProductSubgroupBoard({
  expanded,
  expandedSubgroups,
  limit,
  groupBy,
  subGroupBy,
}: ProductSubgroupBoardProps) {
  const trpc = useTRPC();

  // 1. Query group counts (columns)
  const { data: groupCounts } = useSuspenseQuery(
    trpc.product.getGroup.queryOptions({ groupBy })
  );

  // 2. Query subgroup counts for each expanded group
  const subgroupCounts = expanded.map((groupValue) => {
    const { data } = useSuspenseQuery(
      trpc.product.getSubGroup.queryOptions({
        groupBy,
        groupValue,
        subGroupBy,
      })
    );
    return { groupKey: groupValue, subgroups: data };
  });

  // 3. Query items for each expanded subgroup
  const expandedData = expandedSubgroups.map((subgroupKey) => {
    const [groupValue, subgroupValue] = subgroupKey.split(":");
    const { data } = useSuspenseQuery(
      trpc.product.getMany.queryOptions({
        filters: [
          { propertyId: groupBy, operator: "eq", value: groupValue },
          { propertyId: subGroupBy, operator: "eq", value: subgroupValue },
        ],
        limit,
      })
    );
    return { groupKey: groupValue, subgroupKey: subgroupValue, items: data.items };
  });

  // 4. Combine all items
  const allItems = expandedData.flatMap((group) => group.items);

  // 5. URL setters
  const { toggleGroup, toggleSubgroup } = useSubgroupControls({
    expanded,
    expandedSubgroups,
  });

  return (
    <DataViewProvider data={allItems} properties={productProperties}>
      <BoardView
        groupBy={groupBy}
        subGroupBy={subGroupBy}
        counts={groupCounts}
        subgroupCounts={subgroupCounts}
        expandedGroups={expanded}
        expandedSubgroups={expandedSubgroups}
        onExpandedChange={toggleGroup}
        onSubgroupExpandedChange={toggleSubgroup}
        layout={{ columnWidth: 320, gap: "md" }}
      />
    </DataViewProvider>
  );
}
```

## useSubgroupControls Hook

```tsx
export function useSubgroupControls({ expanded, expandedSubgroups }) {
  const [, setExpanded] = useQueryState(
    "expanded",
    parseAsArrayOf(parseAsString).withOptions({ shallow: false })
  );
  const [, setExpandedSubgroups] = useQueryState(
    "expandedSubgroups",
    parseAsArrayOf(parseAsString).withOptions({ shallow: false })
  );

  const toggleGroup = (groupKey: string) => {
    const newExpanded = expanded.includes(groupKey)
      ? expanded.filter((g) => g !== groupKey)
      : [...expanded, groupKey];
    setExpanded(newExpanded.length > 0 ? newExpanded : null);

    // Also remove subgroups for collapsed group
    if (expanded.includes(groupKey)) {
      const newSubgroups = expandedSubgroups.filter(
        (sg) => !sg.startsWith(`${groupKey}:`)
      );
      setExpandedSubgroups(newSubgroups.length > 0 ? newSubgroups : null);
    }
  };

  const toggleSubgroup = (groupKey: string, subgroupKey: string) => {
    const key = `${groupKey}:${subgroupKey}`;
    const newSubgroups = expandedSubgroups.includes(key)
      ? expandedSubgroups.filter((sg) => sg !== key)
      : [...expandedSubgroups, key];
    setExpandedSubgroups(newSubgroups.length > 0 ? newSubgroups : null);
  };

  return { toggleGroup, toggleSubgroup };
}
```

## URL Structure

```
?expanded=Electronics,Clothing
&expandedSubgroups=Electronics:ACTIVE,Electronics:PENDING,Clothing:ACTIVE
&limit=25
&groupBy=familyGroup
&subGroupBy=status
```
