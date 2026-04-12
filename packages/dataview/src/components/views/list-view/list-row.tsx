"use client";

import { cn } from "../../../lib/utils";
import type { DataViewProperty } from "../../../types/property.type";
import { Separator } from "../../ui/separator";
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

  /**
   * Show horizontal divider lines between rows
   */
  showHorizontalLines?: boolean;
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
  showHorizontalLines,
}: ListRowProps<TData>) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="flex w-full flex-col gap-1">
        {data.map((item, index) => {
          // Generate a unique key by combining property values or fallback to index
          const firstProperty = displayProperties[0];
          const firstValue = firstProperty
            ? (item as Record<string, unknown>)[firstProperty.id]
            : undefined;
          const uniqueKey = firstValue
            ? `row-${String(firstValue)}-${index}`
            : `row-${index}`;

          const RowElement = onItemClick ? "button" : "div";

          return (
            <div
              className={
                showHorizontalLines && index > 0
                  ? "flex flex-col gap-1"
                  : undefined
              }
              key={uniqueKey}
            >
              {showHorizontalLines && index > 0 && <Separator />}
              <RowElement
                className={cn(
                  "flex items-center gap-4 rounded-md px-2 py-1 transition-colors hover:bg-muted",
                  onItemClick &&
                    "cursor-pointer border-0 bg-transparent text-left"
                )}
                onClick={() => onItemClick?.(item)}
                {...(onItemClick && { type: "button" as const })}
              >
                {displayProperties.map((property, propIndex) => {
                  const value = (item as Record<string, unknown>)[property.id];
                  const isFirst = propIndex === 0;

                  let itemStyle:
                    | { minWidth?: string; width?: number }
                    | undefined;
                  if (isFirst) {
                    itemStyle = {
                      minWidth: ROW_SKELETON_WIDTHS[property.type],
                    };
                  } else if (property.size) {
                    itemStyle = { width: property.size };
                  }

                  return (
                    <div
                      className={cn(
                        "flex items-center",
                        isFirst
                          ? "min-w-0 flex-1 overflow-hidden font-medium"
                          : "shrink-0"
                      )}
                      key={String(property.id)}
                      style={itemStyle}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
