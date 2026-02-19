"use client";

import { cn } from "../../../lib/utils";
import type { DataViewProperty } from "../../../types";
import { DataCell } from "../data-cell";

export interface ListRowProps<TData> {
  /**
   * All property definitions - required for formula properties
   */
  allProperties?: readonly DataViewProperty<TData>[];

  /**
   * Additional className
   */
  className?: string;
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
}

/**
 * DataList - Core list component
 * Renders list items without grouping logic
 */
export function ListRow<TData>({
  data,
  displayProperties,
  allProperties,
  onItemClick,
  className,
}: ListRowProps<TData>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex w-max min-w-full flex-col">
        {data.map((item, index) => {
          // Generate a unique key by combining property values or fallback to index
          const firstProperty = displayProperties[0];
          const uniqueKey = firstProperty
            ? `row-${String((item as Record<string, unknown>)[firstProperty.id])}-${index}`
            : `row-${index}`;

          const RowElement = onItemClick ? "button" : "div";

          return (
            <RowElement
              className={cn(
                "flex items-center gap-4 rounded-md px-2 py-1 transition-colors hover:bg-muted",
                onItemClick &&
                  "cursor-pointer border-0 bg-transparent text-left"
              )}
              key={uniqueKey}
              onClick={() => onItemClick?.(item)}
              {...(onItemClick && { type: "button" as const })}
            >
              {displayProperties.map((property, propIndex) => {
                const value = (item as Record<string, unknown>)[property.id];
                const isFirst = propIndex === 0;

                return (
                  <div
                    className={cn(
                      "flex shrink-0 items-center",
                      isFirst && "font-medium"
                    )}
                    key={String(property.id)}
                  >
                    <DataCell
                      allProperties={allProperties}
                      item={item}
                      property={property}
                      value={value}
                    />
                  </div>
                );
              })}
            </RowElement>
          );
        })}
      </div>
    </div>
  );
}
