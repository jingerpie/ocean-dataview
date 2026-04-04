"use client";

import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";

/** Regex to extract width number from Tailwind class (e.g., "w-80" -> "80") */
const TAILWIND_WIDTH_REGEX = /w-(\d+)/;

/**
 * Extract numeric width from Tailwind class (e.g., "w-80" -> 320px)
 * Tailwind w-N = N * 0.25rem = N * 4px (at 16px base)
 */
export function parseColumnWidth(columnWidth: string): number {
  const match = columnWidth.match(TAILWIND_WIDTH_REGEX);
  if (match) {
    return Number.parseInt(match[1] ?? "0", 10) * 4;
  }
  return 320; // default fallback
}

export interface BoardColumnHeadersProps {
  /**
   * Additional className
   */
  className?: string;

  /**
   * Column header renderer
   */
  columnHeader?: (groupName: string, count: number) => ReactNode;

  /**
   * Column width class
   */
  columnWidth?: string;

  /**
   * Column background class (color)
   */
  getColumnBgClass?: (groupName: string) => string | undefined;
  /**
   * Grouped data to display (one group per column)
   */
  groups: Array<{
    key: string;
    count: number;
    displayCount?: string;
  }>;

  /**
   * Ref forwarded to the header row div (for sticky visibility detection)
   */
  headerRef?: React.RefObject<HTMLDivElement | null>;

  /**
   * Corner rounding style
   * - "top": rounded-t-lg (connected to cards below)
   * - "bottom": rounded-b-lg (standalone, no cards below)
   * - "all": rounded-lg (standalone)
   * Default: "all"
   */
  rounded?: "top" | "bottom" | "all";
}

/**
 * BoardColumnHeaders - Renders the original column headers row.
 * Sticky behavior is handled externally by the board view via StickyColumnLabel.
 */
export function BoardColumnHeaders({
  groups,
  columnHeader,
  getColumnBgClass,
  columnWidth = "w-80",
  rounded = "all",
  className,
  headerRef,
}: BoardColumnHeadersProps) {
  const columnWidthPx = parseColumnWidth(columnWidth);

  const roundedClass = {
    top: "rounded-t-lg",
    bottom: "rounded-b-lg",
    all: "rounded-lg",
  }[rounded];

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
    <div className={cn("flex gap-4 bg-background", className)} ref={headerRef}>
      {groups.map((group) => {
        const bgClass = getColumnBgClass?.(group.key) || "bg-muted/30";

        return (
          <div
            className={cn("shrink-0 p-2", roundedClass, bgClass)}
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
  );
}
