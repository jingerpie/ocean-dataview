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
   * Ref to the scrollable container (for sticky behavior coordination)
   */
  containerRef?: React.RefObject<HTMLDivElement | null>;

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
   * Corner rounding style
   * - "top": rounded-t-lg (connected to cards below)
   * - "bottom": rounded-b-lg (standalone, no cards below)
   * - "all": rounded-lg (standalone)
   * Default: "all"
   */
  rounded?: "top" | "bottom" | "all";

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
 * BoardColumnHeaders - Renders column headers for board view
 * Used separately from BoardColumns for sub-grouped boards
 */
export function BoardColumnHeaders({
  groups,
  columnHeader,
  getColumnBgClass,
  columnWidth = "w-80",
  stickyHeader,
  rounded = "all",
  className,
  containerRef: externalContainerRef,
}: BoardColumnHeadersProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef ?? internalContainerRef;

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
    <div className={cn("relative", className)}>
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

      {/* Column Headers Row */}
      <div className="flex gap-4 bg-background" ref={headerRef}>
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
    </div>
  );
}
