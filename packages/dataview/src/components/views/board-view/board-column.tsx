"use client";

import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";

interface BoardColumnProps<TData> {
  groupName: string;
  items: TData[];
  cardContent: (item: TData, index: number) => ReactNode;
  keyExtractor: (item: TData, index: number) => string;
  columnHeader?: (groupName: string, count: number) => ReactNode;
  columnBgClass?: string;
  columnWidth?: string;
  renderFooter?: () => ReactNode;
}

/**
 * BoardColumn - Single column for flat (non-sub-grouped) boards
 * For sub-grouped boards, use BoardRowLayout instead
 */
export function BoardColumn<TData>({
  groupName,
  items,
  cardContent,
  keyExtractor,
  columnHeader,
  columnBgClass,
  columnWidth,
  renderFooter,
}: BoardColumnProps<TData>) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-4 rounded-lg p-2 transition-colors",
        columnWidth,
        columnBgClass || "bg-muted/10"
      )}
    >
      {/* Column Header */}
      {columnHeader ? (
        columnHeader(groupName, items.length)
      ) : (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{groupName}</h3>
          <Badge className="ml-2" variant="secondary">
            {items.length}
          </Badge>
        </div>
      )}

      {/* Cards */}
      <div className="flex min-h-50 flex-1 flex-col gap-4 overflow-y-auto p-1">
        {items.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
            No items
          </div>
        ) : (
          items.map((item, index) => (
            <div key={keyExtractor(item, index)}>
              {cardContent(item, index)}
            </div>
          ))
        )}
        {/* Column Footer (pagination) */}
        {renderFooter?.()}
      </div>
    </div>
  );
}
