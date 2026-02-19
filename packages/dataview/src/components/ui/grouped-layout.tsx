"use client";

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

  /** Callback when accordion value changes */
  onAccordionChange?: (value: string[]) => void;

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
}: GroupedLayoutProps<TData>) {
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
              isLoading={false}
              key={group.key}
              renderFooter={renderPagination(pagination, paginationContext)}
              showAggregation={showAggregation}
            >
              {renderGroupContent(group)}
            </GroupSection>
          );
        })}
      </Accordion>
    </div>
  );
}
