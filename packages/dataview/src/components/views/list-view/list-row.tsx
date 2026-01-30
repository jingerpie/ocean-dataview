"use client";

import { Separator } from "@ocean-dataview/dataview/components/ui/separator";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import { PropertyDisplay } from "../../ui/properties";

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
   * Show dividers between items
   */
  showDividers: boolean;

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
  showDividers,
  onItemClick,
  className,
}: ListRowProps<TData>) {
  return (
    <div className={cn("flex flex-col gap-0", className)}>
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
                "flex w-full items-center gap-4 px-3 py-2",
                onItemClick &&
                  "cursor-pointer border-0 bg-transparent text-left transition-colors hover:bg-muted/50"
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
                    <PropertyDisplay
                      item={item}
                      property={property}
                      value={value}
                      wrap={false}
                    />
                  </div>
                );
              })}
            </RowElement>
            {showDividers && index < data.length - 1 && <Separator />}
          </div>
        );
      })}
    </div>
  );
}
