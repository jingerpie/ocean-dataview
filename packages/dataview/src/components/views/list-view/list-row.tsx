"use client";

import { cn } from "../../../lib/utils";
import type { DataViewProperty } from "../../../types";
import { DataCell } from "../data-cell";

export interface ListRowProps<TData> {
  /**
   * Data to display in the list
   */
  data: TData[];

  /**
   * Property definitions for display (excluding groupBy)
   */
  displayProperties: DataViewProperty<TData>[];

  /**
   * Item click handler
   */
  onItemClick?: (item: TData) => void;

  /**
   * Additional className
   */
  className?: string;
}

/**
 * DataList - Core list component
 * Renders list items without grouping logic
 */
export function ListRow<TData>({
  data,
  displayProperties,
  onItemClick,
  className,
}: ListRowProps<TData>) {
  return (
    <div className={cn("flex flex-col overflow-x-auto", className)}>
      {data.map((item, index) => {
        // Generate a unique key by combining property values or fallback to index
        const firstProperty = displayProperties[0];
        const uniqueKey = firstProperty
          ? `row-${String((item as Record<string, unknown>)[firstProperty.id])}-${index}`
          : `row-${index}`;

        const RowElement = onItemClick ? "button" : "div";

        return (
          <div key={uniqueKey}>
            <RowElement
              className={cn(
                "flex w-full items-center gap-4 rounded-md px-2 py-1 transition-colors hover:bg-muted/50",
                onItemClick &&
                  "cursor-pointer border-0 bg-transparent text-left"
              )}
              onClick={() => onItemClick?.(item)}
              {...(onItemClick && { type: "button" as const })}
            >
              {displayProperties.map((property, propIndex) => {
                const value = (item as Record<string, unknown>)[property.id];
                const isFirst = propIndex === 0;

                return (
                  <div
                    className={cn(
                      "flex items-center",
                      isFirst ? "flex-1 font-medium" : "shrink-0"
                    )}
                    key={String(property.id)}
                  >
                    <DataCell item={item} property={property} value={value} />
                  </div>
                );
              })}
            </RowElement>
          </div>
        );
      })}
    </div>
  );
}
