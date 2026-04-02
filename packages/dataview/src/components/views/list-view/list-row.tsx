"use client";

import { cn } from "../../../lib/utils";
import type { DataViewProperty } from "../../../types/property.type";
import { DataCell } from "../data-cell";
import { ROW_SKELETON_WIDTHS } from "../skeleton-widths";

export interface ListRowProps<TData> {
  /**
   * All property schema - required for formula properties
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
   * Property schema for display (excluding groupBy)
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
    <div className={cn("overflow-hidden", className)}>
      <div className="flex w-full flex-col">
        {data.map((item, index) => {
          // Generate a unique key by combining property values or fallback to index
          const firstProperty = displayProperties[0];
          const firstValue =
            firstProperty &&
            firstProperty.type !== "formula" &&
            firstProperty.type !== "button"
              ? (item as Record<string, unknown>)[firstProperty.key]
              : undefined;
          const uniqueKey = firstValue
            ? `row-${String(firstValue)}-${index}`
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
                const value =
                  property.type === "formula" || property.type === "button"
                    ? undefined
                    : (item as Record<string, unknown>)[property.key];
                const isFirst = propIndex === 0;

                return (
                  <div
                    className={cn(
                      "flex items-center",
                      isFirst
                        ? "min-w-0 flex-1 overflow-hidden font-medium"
                        : "shrink-0"
                    )}
                    key={String(property.id)}
                    style={
                      isFirst
                        ? { minWidth: ROW_SKELETON_WIDTHS[property.type] }
                        : undefined
                    }
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
