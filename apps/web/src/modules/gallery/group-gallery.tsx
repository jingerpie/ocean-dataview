"use client";

import {
  useInfinitePagination,
  usePaginationState,
} from "@sparkyidea/dataview/hooks";
import { DataViewProvider } from "@sparkyidea/dataview/providers";
import { NotionToolbar } from "@sparkyidea/dataview/toolbars/notion";
import { getSearchableProperties } from "@sparkyidea/dataview/types";
import {
  GallerySkeleton,
  GalleryView,
} from "@sparkyidea/dataview/views/gallery-view";
import type { WhereNode } from "@sparkyidea/shared/types";
import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { productProperties } from "@/properties/product-properties";
import { combineGroupFilter } from "@/utils/group-filter";
import { buildSearchFilter } from "@/utils/search";
import { useTRPC } from "@/utils/trpc/client";
import { ViewTabs } from "./view-tabs";

const groupConfig = { bySelect: { property: "category" } } as const;

interface GroupGalleryProps {
  expanded: string[];
  filter: WhereNode[] | null;
  group: GroupConfigInput | null;
  limit: Limit;
  search: string;
  sort: { property: string; direction: "asc" | "desc" }[];
}

/**
 * Grouped Gallery - grouped by category with per-group load more.
 *
 * Uses useInfinitePagination hook that returns a pagination controller
 * which is passed to DataViewProvider.
 */
export function GroupGallery({
  expanded,
  filter,
  limit,
  search,
  sort,
}: GroupGalleryProps) {
  const trpc = useTRPC();

  const searchableFields = getSearchableProperties(productProperties);

  const { pagination } = useInfinitePagination({
    // Factory for group counts - used internally by QueryBridge
    groupQueryOptionsFactory: (groupCfg) =>
      trpc.product.getGroup.queryOptions({ groupBy: groupCfg }),

    // Factory for data items
    queryOptionsFactory: (params) =>
      trpc.product.getMany.infiniteQueryOptions(
        {
          filter: combineGroupFilter(
            params.groupConfig ?? groupConfig,
            params.groupKey ?? "",
            params.filter
          ),
          search: buildSearchFilter(params.search, searchableFields),
          sort: params.sort ?? [],
          limit: params.limit,
        },
        {
          getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.endCursor : undefined,
        }
      ),
  });

  // DataViewProvider MUST render for queries to execute
  return (
    <DataViewProvider
      defaults={{
        expanded: expanded.length > 0 ? expanded : [],
        filter,
        group: { ...groupConfig, showCount: true },
        limit,
        search,
        sort: sort ?? [],
      }}
      pagination={pagination}
      properties={productProperties}
    >
      <GroupGalleryContent />
    </DataViewProvider>
  );
}

function GroupGalleryContent() {
  const { isEmpty, isLoading, isPlaceholderData } = usePaginationState();

  if (isLoading && isEmpty) {
    return <GallerySkeleton cardCount={6} />;
  }

  if (isEmpty) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <>
      <NotionToolbar
        enableSettings
        groupProperty="Category"
        properties={productProperties}
      >
        <ViewTabs />
      </NotionToolbar>
      <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
        <GalleryView
          cardPreview="productImage"
          cardSize="medium"
          fitMedia
          pagination="loadMore"
        />
      </div>
    </>
  );
}
