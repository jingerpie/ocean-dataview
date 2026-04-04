"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "../../lib/utils";
import type { DataViewProperty } from "../../types/property.type";
import { Card, CardContent } from "../ui/card";
import { DataCell } from "./data-cell";

export interface DataCardProps<TData> {
  /**
   * All property schema - required for formula properties
   */
  allProperties?: readonly DataViewProperty<TData>[];

  /**
   * Card preview property ID (references property.id, not data key)
   */
  cardPreview?: string;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Property schema for display
   */
  displayProperties: DataViewProperty<TData>[];

  /**
   * Fit image (object-cover) or contain (object-contain)
   * @default true
   */
  fitMedia?: boolean;

  /**
   * Image height in pixels
   */
  imageHeight: number;
  /**
   * Item data to display
   */
  item: TData;

  /**
   * Card click handler
   */
  onCardClick?: (item: TData) => void;

  /**
   * Show property names
   */
  showPropertyNames?: boolean;

  /**
   * Wrap all properties
   */
  wrapAllProperties?: boolean;
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
  // Handle cardPreview - resolve through property.key for correct data access
  const previewProperty = cardPreview
    ? (allProperties ?? displayProperties).find((p) => p.id === cardPreview)
    : undefined;
  const previewKey = previewProperty?.key ?? cardPreview;
  const previewValue = previewKey
    ? (item as Record<string, unknown>)[previewKey]
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
                fitMedia ? "object-contain" : "object-cover"
              )}
              fill
              loading="lazy"
              sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw"
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
          const value = property.key
            ? (item as Record<string, unknown>)[property.key]
            : undefined;
          const isFirst = propIndex === 0;
          const resolvedShowName = property.showName ?? showPropertyNames;
          const resolvedWrap = property.wrap ?? wrapAllProperties;

          return (
            <div
              className={cn(
                "flex w-full min-w-0 flex-col items-start",
                isFirst && "font-medium",
                (property.type === "select" ||
                  property.type === "multiSelect" ||
                  property.type === "status" ||
                  property.type === "filesMedia") &&
                  "gap-1"
              )}
              key={String(property.id)}
            >
              {resolvedShowName && (
                <span className="text-muted-foreground text-xs">
                  {property.name ?? String(property.id)}
                </span>
              )}
              <DataCell
                allProperties={allProperties}
                item={item}
                property={property}
                value={value}
                wrap={resolvedWrap}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
