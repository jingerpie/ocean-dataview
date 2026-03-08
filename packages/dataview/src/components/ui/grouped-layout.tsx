"use client";

import { Loader2 } from "lucide-react";
import type { GroupedDataItem } from "../../hooks";
import { useIntersectionObserver } from "../../hooks/use-intersection-observer";
import type { DataViewProperty, PaginationContext } from "../../types";
import { Accordion } from "./accordion";
import { GroupSection } from "./group-section";
import { type PaginationMode, renderPagination } from "./paginations";

interface GroupedLayoutProps<TData> {
  /** Optional className for the container */
  className?: string;

  /** Default expanded accordion values */
  defaultExpanded?: string[];

  /** Function to get pagination context for a group */
  getPaginationContext?: (groupKey: string) => PaginationContext | undefined;

  /** Property definition for the groupBy field */
  groupByProperty: DataViewProperty<TData> | undefined;
  /** Grouped data items to render */
  groups: GroupedDataItem<TData>[];

  /** Whether there are more groups to load */
  hasNextGroupPage?: boolean;

  /** Whether currently fetching more groups */
  isFetchingNextGroupPage?: boolean;

  /** Callback when accordion value changes */
  onAccordionChange?: (value: string[]) => void;

  /** Callback to load more groups */
  onLoadMoreGroups?: () => void;

  /** Pagination mode */
  pagination?: PaginationMode;

  /** Render function for group content */
  renderGroupContent: (group: GroupedDataItem<TData>) => React.ReactNode;

  /** Display aggregation counts in group headers (default: true) */
  showAggregation?: boolean;
}

/**
 * Shared component for rendering grouped data with accordion layout
 * Eliminates duplication across TableView, ListView, BoardView, GalleryView
 * Groups always use infinite scroll pagination (auto-load on scroll)
 */
export function GroupedLayout<TData>({
  groups,
  groupByProperty,
  defaultExpanded,
  onAccordionChange,
  renderGroupContent,
  pagination,
  getPaginationContext,
  className,
  showAggregation = true,
  hasNextGroupPage,
  isFetchingNextGroupPage,
  onLoadMoreGroups,
}: GroupedLayoutProps<TData>) {
  const { targetRef } = useIntersectionObserver({
    rootMargin: "200px",
    recheckOn: [isFetchingNextGroupPage],
    onVisible: () => {
      if (hasNextGroupPage && !isFetchingNextGroupPage && onLoadMoreGroups) {
        onLoadMoreGroups();
      }
    },
  });

  return (
    <div className={className}>
      <Accordion
        defaultValue={defaultExpanded}
        multiple
        onValueChange={onAccordionChange}
      >
        {groups.map((group) => {
          const paginationContext = getPaginationContext?.(group.key);

          return (
            <GroupSection
              group={group}
              groupByPropertyDef={groupByProperty}
              key={group.key}
              renderFooter={renderPagination(pagination, paginationContext)}
              showAggregation={showAggregation}
            >
              {renderGroupContent(group)}
            </GroupSection>
          );
        })}
      </Accordion>

      {/* Infinite scroll sentinel for loading more groups */}
      {(hasNextGroupPage || isFetchingNextGroupPage) && (
        <div className="flex items-center justify-center py-4" ref={targetRef}>
          {isFetchingNextGroupPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading more groups...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
