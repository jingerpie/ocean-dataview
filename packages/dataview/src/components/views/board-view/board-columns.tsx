"use client";

import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

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

export interface BoardColumnsProps<TData> {
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
   * Column background class (color)
   */
  getColumnBgClass?: (groupName: string) => string | undefined;

  /**
   * Column width class
   */
  columnWidth?: string;

  /**
   * Footer renderer (for pagination below cards)
   */
  renderFooter?: (groupKey: string) => ReactNode;

  /**
   * Custom function to get items for a column
   * If provided, uses this instead of group.items
   * Useful for sub-grouped boards where items are filtered by sub-group
   */
  getItems?: (groupKey: string) => TData[];

  /**
   * Corner rounding style
   * - "top": rounded-t-lg (standalone, no header above)
   * - "bottom": rounded-b-lg (connected to header above)
   * - "all": rounded-lg (standalone in accordion)
   * Default: "all"
   */
  rounded?: "top" | "bottom" | "all";

  /**
   * Additional className for the cards container
   */
  className?: string;
}

/**
 * BoardColumns - Renders card columns for board view
 * Used with BoardColumnHeaders for both flat and sub-grouped boards
 */
export function BoardColumns<TData>({
  groups,
  cardContent,
  keyExtractor,
  getColumnBgClass,
  columnWidth = "w-80",
  renderFooter,
  getItems,
  rounded = "all",
  className,
}: BoardColumnsProps<TData>) {
  const columnWidthPx = parseColumnWidth(columnWidth);

  const roundedClass = {
    top: "rounded-t-lg",
    bottom: "rounded-b-lg",
    all: "rounded-lg",
  }[rounded];

  return (
    <div className={cn("flex gap-4", className)}>
      {groups.map((group) => {
        const bgClass = getColumnBgClass?.(group.key) || "bg-muted/10";
        // Use getItems if provided, otherwise fall back to group.items
        const items = getItems?.(group.key) ?? group.items;

        return (
          <div
            className={cn(
              "flex min-h-50 shrink-0 flex-col gap-4 p-2 transition-colors",
              roundedClass,
              bgClass
            )}
            key={group.key}
            style={{ width: columnWidthPx }}
          >
            {items.length === 0 ? (
              <div className="min-h-10" />
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((item, index) => (
                  <div key={keyExtractor(item, index)}>
                    {cardContent(item, index)}
                  </div>
                ))}
              </div>
            )}
            {/* Footer (pagination) */}
            {renderFooter?.(group.key)}
          </div>
        );
      })}
    </div>
  );
}
