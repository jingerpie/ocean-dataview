"use client";

import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";
import { BoardColumn } from "./board-column";

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
  columnWidth,
  renderColumnFooter,
  className,
}: BoardColumnCardProps<TData>) {
  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
      {groups.map((group) => (
        <BoardColumn
          cardContent={cardContent}
          columnBgClass={getColumnBgClass?.(group.key)}
          columnHeader={columnHeader}
          columnWidth={columnWidth}
          groupName={group.key}
          items={group.items}
          key={group.key}
          keyExtractor={keyExtractor}
          renderFooter={
            renderColumnFooter ? () => renderColumnFooter(group.key) : undefined
          }
        />
      ))}
    </div>
  );
}
