"use client";

import { type ReactNode, useRef } from "react";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
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

export interface BoardColumnCardProps<TData> {
  /**
   * Grouped data to display (one group per column)
   */
  groups: Array<{
    key: string;
    items: TData[];
    count: number;
    sortValue: string | number;
  }>;

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
   * Column footer renderer (for pagination)
   */
  renderColumnFooter?: (groupKey: string) => ReactNode;

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
 * BoardColumnCard - Board layout with flat columns (no sub-grouping)
 * For sub-grouped boards, BoardView uses BoardRowLayout instead
 */
export function BoardColumnCard<TData>({
  groups,
  cardContent,
  keyExtractor,
  columnHeader,
  getColumnBgClass,
  columnWidth = "w-80",
  renderColumnFooter,
  className,
  stickyHeader,
}: BoardColumnCardProps<TData>) {
  // Refs for sticky header
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const columnWidthPx = parseColumnWidth(columnWidth);

  // Default column header renderer
  const defaultColumnHeader = (groupName: string, count: number) => (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-sm">{groupName}</h3>
      <Badge className="ml-2" variant="secondary">
        {count}
      </Badge>
    </div>
  );

  return (
    <div className={cn("relative max-w-full overflow-clip", className)}>
      {/* Portal-based sticky column labels */}
      {stickyHeader?.enabled && (
        <StickyColumnLabel
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
          {/* Column Headers Row */}
          <div className="flex gap-4 bg-background" ref={headerRef}>
            {groups.map((group) => {
              const bgClass = getColumnBgClass?.(group.key) || "bg-muted/10";

              return (
                <div
                  className={cn("shrink-0 rounded-t-lg p-2", bgClass)}
                  key={group.key}
                  style={{ width: columnWidthPx }}
                >
                  {columnHeader
                    ? columnHeader(group.key, group.count)
                    : defaultColumnHeader(group.key, group.count)}
                </div>
              );
            })}
          </div>

          {/* Column Cards Row */}
          <div className="flex gap-4">
            {groups.map((group) => {
              const bgClass = getColumnBgClass?.(group.key) || "bg-muted/10";

              return (
                <div
                  className={cn(
                    "flex min-h-50 shrink-0 flex-col gap-4 overflow-y-auto rounded-b-lg p-2 transition-colors",
                    bgClass
                  )}
                  key={group.key}
                  style={{ width: columnWidthPx }}
                >
                  {group.items.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                      No items
                    </div>
                  ) : (
                    group.items.map((item, index) => (
                      <div key={keyExtractor(item, index)}>
                        {cardContent(item, index)}
                      </div>
                    ))
                  )}
                  {/* Column Footer (pagination) */}
                  {renderColumnFooter?.(group.key)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
