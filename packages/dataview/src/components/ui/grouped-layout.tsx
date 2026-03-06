"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type { GroupedDataItem } from "../../hooks";
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
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Use refs to avoid stale closures in the intersection observer callback
  const stateRef = useRef({
    hasNextGroupPage,
    isFetchingNextGroupPage,
    onLoadMoreGroups,
  });
  stateRef.current = {
    hasNextGroupPage,
    isFetchingNextGroupPage,
    onLoadMoreGroups,
  };

  const handleIntersect = useCallback(() => {
    const { hasNextGroupPage, isFetchingNextGroupPage, onLoadMoreGroups } =
      stateRef.current;
    if (hasNextGroupPage && !isFetchingNextGroupPage && onLoadMoreGroups) {
      onLoadMoreGroups();
    }
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleIntersect();
        }
      },
      {
        rootMargin: "200px", // Trigger 200px before reaching the sentinel
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersect]);

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
        <div
          className="flex items-center justify-center py-4"
          ref={sentinelRef}
        >
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
