"use client";

import { type ReactNode, useCallback, useMemo, useRef } from "react";
import { cn, groupByProperty as groupDataByProperty } from "../../../lib/utils";
import type { DataViewProperty, GroupCounts } from "../../../types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { DataCell } from "../data-cell";
import { StickyGroupLabel } from "../sticky-group-label";
import { StickyColumnLabel } from "./sticky-column-label";

/** Regex to extract width number from Tailwind class (e.g., "w-80" -> "80") */
const TAILWIND_WIDTH_REGEX = /w-(\d+)/;

/**
 * Extract numeric width from Tailwind class (e.g., "w-80" -> 320px)
 * Tailwind w-N = N * 0.25rem = N * 4px (at 16px base)
 */
function parseColumnWidth(columnWidth: string): number {
  const match = columnWidth.match(TAILWIND_WIDTH_REGEX);
  if (match) {
    return Number.parseInt(match[1] ?? "0", 10) * 4;
  }
  return 320; // default fallback
}

export interface BoardRowLayoutProps<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
> {
  /**
   * Grouped data to display (one group per column)
   */
  groups: Array<{
    key: string;
    items: TData[];
    count: number;
    displayCount?: string;
    sortValue: string | number;
  }>;

  /**
   * Property definitions
   */
  properties: TProperties;

  /**
   * Sub-grouping configuration
   */
  subGroup: {
    /** Property ID to sub-group by */
    subGroupBy: TProperties[number]["id"];
    /** How to sub-group the data */
    showAs?:
      | "day"
      | "week"
      | "month"
      | "year"
      | "relative"
      | "group"
      | "option";
    /** Week start day (only for showAs: 'week') */
    startWeekOn?: "monday" | "sunday";
    /** Sort sub-groups by property value */
    sort?: "propertyAscending" | "propertyDescending";
    /** Hide sub-groups with no items */
    hideEmptyGroups?: boolean;
    /** Default expanded sub-groups (for uncontrolled mode) */
    defaultExpanded?: string[];
    /** Controlled sub-group expansion state */
    expandedSubGroups?: string[];
    /** Callback when sub-group expansion changes */
    onExpandedSubGroupsChange?: (groups: string[]) => void;
    /** Server-side sub-group counts (for row headers) */
    counts?: GroupCounts;
  };

  /**
   * Card content renderer
   */
  cardContent: (item: TData, index: number) => ReactNode;

  /**
   * Key extractor function
   */
  keyExtractor: (item: TData, index: number) => string;

  /**
   * Column header renderer
   */
  columnHeader?: (groupName: string, count: number) => ReactNode;

  /**
   * Column background class (color)
   */
  getColumnBgClass?: (groupName: string) => string | undefined;

  /**
   * Column width class
   */
  columnWidth?: string;

  /**
   * Footer renderer (for pagination below cards in each sub-group)
   * Renders per-column within each sub-group row
   * All buttons in a row trigger the same action (load more for that sub-group)
   */
  renderFooter?: (subGroupKey: string) => ReactNode;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Sticky header configuration
   */
  stickyHeader?: {
    /** Enable portal-based sticky header for page scroll */
    enabled: boolean;
    /** Offset from top of viewport (e.g., navbar height) */
    offset?: number;
  };
}

/**
 * BoardRowLayout - Row-based board layout with full-width sub-groups (Notion-style)
 * Sub-groups span across all columns as horizontal bands
 */
export function BoardRowLayout<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({
  groups,
  properties,
  subGroup: subGroupConfig,
  cardContent,
  keyExtractor,
  columnHeader,
  getColumnBgClass,
  columnWidth = "w-80",
  renderFooter,
  className,
  stickyHeader,
}: BoardRowLayoutProps<TData, TProperties>) {
  // Extract counts from subGroup config
  const subGroupCounts = subGroupConfig.counts;
  // Refs for sticky header
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the subGroupBy property definition
  const subGroupByPropertyDef = useMemo(() => {
    return properties.find((prop) => prop.id === subGroupConfig.subGroupBy);
  }, [properties, subGroupConfig.subGroupBy]);

  // Collect all unique sub-group keys across all groups and sort them
  // When server counts are available, use them for accurate totals
  const allSubGroupData = useMemo(() => {
    // Flatten all items from all groups
    const allItems = groups.flatMap((g) => g.items);

    if (allItems.length === 0 && !subGroupCounts) {
      return [];
    }

    const { groups: subGroups, sortValues } = groupDataByProperty(
      allItems,
      subGroupConfig.subGroupBy,
      properties,
      subGroupConfig.showAs,
      subGroupConfig.startWeekOn
    );

    // Get all unique sub-group keys (from either client data or server counts)
    const allSubGroupKeys = new Set([
      ...Object.keys(subGroups),
      ...Object.keys(subGroupCounts ?? {}),
    ]);

    // Build sub-group array with counts
    const subGroupArray = Array.from(allSubGroupKeys).map((key) => {
      const serverCount = subGroupCounts?.[key];
      const clientItems = subGroups[key] as TData[] | undefined;
      const clientCount = clientItems?.length ?? 0;

      // Prefer server counts when available
      const count = serverCount?.count ?? clientCount;
      const hasMore = serverCount?.hasMore ?? false;

      return {
        key,
        totalCount: count,
        // Show 99+ if any group has more OR if total exceeds 99
        displayCount: hasMore || count > 99 ? "99+" : String(count),
        sortValue: sortValues[key] ?? key,
      };
    });

    // Sort sub-groups
    const sortOrder = subGroupConfig.sort ?? "propertyAscending";
    subGroupArray.sort((a, b) => {
      const multiplier = sortOrder === "propertyDescending" ? -1 : 1;
      if (typeof a.sortValue === "number" && typeof b.sortValue === "number") {
        return (a.sortValue - b.sortValue) * multiplier;
      }
      return (
        String(a.sortValue).localeCompare(String(b.sortValue)) * multiplier
      );
    });

    return subGroupArray;
  }, [groups, subGroupConfig, properties, subGroupCounts]);

  // Get items for a specific cell (column group + sub-group)
  const getItemsForCell = useCallback(
    (groupKey: string, subGroupKey: string): TData[] => {
      const group = groups.find((g) => g.key === groupKey);
      if (!group) {
        return [];
      }

      // Group items by sub-group property
      const { groups: subGroups } = groupDataByProperty(
        group.items,
        subGroupConfig.subGroupBy,
        properties,
        subGroupConfig.showAs,
        subGroupConfig.startWeekOn
      );

      return (subGroups[subGroupKey] as TData[]) || [];
    },
    [groups, subGroupConfig, properties]
  );

  // Filter sub-groups based on hideEmptyGroups
  // Uses server counts (totalCount) when available, consistent with Table/List/Gallery views
  const visibleSubGroups = useMemo(() => {
    const hideEmpty = subGroupConfig.hideEmptyGroups ?? true;

    if (!hideEmpty) {
      return allSubGroupData;
    }

    // Filter by totalCount (from server counts) to show groups even when items aren't loaded yet
    return allSubGroupData.filter((subGroup) => subGroup.totalCount > 0);
  }, [allSubGroupData, subGroupConfig.hideEmptyGroups]);

  const columnWidthPx = parseColumnWidth(columnWidth);

  return (
    <div className={cn("relative max-w-full overflow-clip", className)}>
      {/* Portal-based sticky column labels */}
      {stickyHeader?.enabled && (
        <StickyColumnLabel
          className="rounded-lg"
          columnHeader={columnHeader}
          columnWidthPx={columnWidthPx}
          containerRef={containerRef}
          enabled={stickyHeader.enabled}
          getColumnBgClass={getColumnBgClass}
          groups={groups}
          headerRef={headerRef}
          offset={stickyHeader.offset}
        />
      )}

      <div className="overflow-x-auto pb-4" ref={containerRef}>
        <div className="min-w-fit">
          {/* Original column headers */}
          <div className="flex gap-4 bg-background" ref={headerRef}>
            {groups.map((group) => (
              <div
                className={cn(
                  "shrink-0 rounded-lg p-2",
                  getColumnBgClass?.(group.key) || "bg-muted/30"
                )}
                key={group.key}
                style={{ width: columnWidthPx }}
              >
                {columnHeader ? (
                  columnHeader(group.key, group.count)
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{group.key}</span>
                    <span className="text-muted-foreground text-xs">
                      {group.displayCount ?? group.count}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sub-group rows */}
          <Accordion
            defaultValue={subGroupConfig.defaultExpanded}
            multiple
            onValueChange={subGroupConfig.onExpandedSubGroupsChange}
            value={subGroupConfig.expandedSubGroups}
          >
            {visibleSubGroups.map((subGroup) => (
              <SubGroupRow
                cardContent={cardContent}
                columnWidthPx={columnWidthPx}
                getColumnBgClass={getColumnBgClass}
                getItemsForCell={getItemsForCell}
                groups={groups}
                key={subGroup.key}
                keyExtractor={keyExtractor}
                renderFooter={renderFooter}
                subGroup={subGroup}
                subGroupByPropertyDef={subGroupByPropertyDef}
              />
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function SubGroupRow<TData>({
  subGroup,
  subGroupByPropertyDef,
  groups,
  columnWidthPx,
  getItemsForCell,
  keyExtractor,
  cardContent,
  getColumnBgClass,
  renderFooter,
}: {
  subGroup: { key: string; displayCount?: string };
  subGroupByPropertyDef?: DataViewProperty<TData>;
  groups: { key: string }[];
  columnWidthPx: number;
  getItemsForCell: (groupKey: string, subGroupKey: string) => TData[];
  keyExtractor: (item: TData, index: number) => string;
  cardContent: (item: TData, index: number) => ReactNode;
  getColumnBgClass?: (groupName: string) => string | undefined;
  renderFooter?: (subGroupKey: string) => ReactNode;
}) {
  const itemRef = useRef<HTMLDivElement>(null);

  return (
    <AccordionItem className="border-b-0" ref={itemRef} value={subGroup.key}>
      <StickyGroupLabel containerRef={itemRef} offset={93}>
        <AccordionTrigger className="flex-initial py-2 hover:no-underline">
          <div className="flex items-center gap-2">
            {subGroupByPropertyDef ? (
              <DataCell
                item={{ [subGroupByPropertyDef.id]: subGroup.key } as TData}
                property={subGroupByPropertyDef}
                value={subGroup.key}
              />
            ) : (
              <span className="font-medium text-sm">{subGroup.key}</span>
            )}
            <span className="font-medium text-muted-foreground text-xs">
              {subGroup.displayCount}
            </span>
          </div>
        </AccordionTrigger>
      </StickyGroupLabel>
      <AccordionContent className="gap-0 pb-0">
        <div className="flex gap-4">
          {groups.map((group) => {
            const cellItems = getItemsForCell(group.key, subGroup.key);
            const columnBgClass = getColumnBgClass?.(group.key);

            return (
              <div
                className={cn(
                  "shrink-0 rounded-lg p-2",
                  columnBgClass || "bg-muted/10"
                )}
                key={group.key}
                style={{ width: columnWidthPx }}
              >
                {cellItems.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {cellItems.map((item, index) => (
                      <div key={keyExtractor(item, index)}>
                        {cardContent(item, index)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-10" />
                )}
                {/* Footer (pagination) - all columns trigger same sub-group action */}
                {renderFooter?.(subGroup.key)}
              </div>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
