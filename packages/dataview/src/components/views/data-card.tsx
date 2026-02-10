"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "../../lib/utils";
import type { DataViewProperty } from "../../types";
import { Card, CardContent } from "../ui/card";
import { DataCell } from "./data-cell";

export interface DataCardProps<TData> {
  /**
   * Item data to display
   */
  item: TData;

  /**
   * Property definitions for display
   */
  displayProperties: DataViewProperty<TData>[];

  /**
   * All property definitions - required for formula properties
   */
  allProperties?: readonly DataViewProperty<TData>[];

  /**
   * Card preview property ID (references property.id, not data key)
   */
  cardPreview?: string;

  /**
   * Image height in pixels
   */
  imageHeight: number;

  /**
   * Fit image (object-cover) or contain (object-contain)
   * @default true
   */
  fitMedia?: boolean;

  /**
   * Wrap all properties
   */
  wrapAllProperties?: boolean;

  /**
   * Show property names
   */
  showPropertyNames?: boolean;

  /**
   * Card click handler
   */
  onCardClick?: (item: TData) => void;

  /**
   * Additional className
   */
  className?: string;
}

/**
 * DataCard - Shared card component for gallery and board views
 * Renders a single card with optional image preview and property values
 */
export function DataCard<TData>({
  item,
  displayProperties,
  allProperties,
  cardPreview,
  imageHeight,
  fitMedia = true,
  wrapAllProperties = false,
  showPropertyNames = false,
  onCardClick,
  className,
}: DataCardProps<TData>) {
  // Handle cardPreview - if it's an array, use the first element
  const previewValue = cardPreview
    ? (item as Record<string, unknown>)[cardPreview]
    : null;
  const imageUrl = Array.isArray(previewValue)
    ? previewValue[0]
    : (previewValue as string);

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden py-0 transition-all hover:shadow-lg",
        onCardClick && "cursor-pointer",
        className
      )}
      onClick={() => onCardClick?.(item)}
    >
      {/* Image Preview - only show if cardPreview is provided */}
      {cardPreview && (
        <div className="relative bg-muted" style={{ height: imageHeight }}>
          {imageUrl ? (
            <Image
              alt="Preview"
              className={cn(
                "transition-opacity",
                fitMedia ? "object-cover" : "object-contain"
              )}
              fill
              loading="lazy"
              src={imageUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      <CardContent className="flex flex-col gap-2 p-3">
        {displayProperties.map((property, propIndex) => {
          const value = (item as Record<string, unknown>)[property.id];
          const isFirst = propIndex === 0;

          return (
            <div
              className={cn(
                "flex flex-col items-start",
                isFirst && "font-medium",
                (property.type === "select" ||
                  property.type === "multiSelect" ||
                  property.type === "status" ||
                  property.type === "filesMedia") &&
                  "gap-1"
              )}
              key={String(property.id)}
            >
              {showPropertyNames && (
                <span className="text-muted-foreground text-xs">
                  {property.label ?? String(property.id)}
                </span>
              )}
              <DataCell
                allProperties={allProperties}
                item={item}
                property={property}
                value={value}
                wrap={wrapAllProperties}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
