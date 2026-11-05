"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { cn } from "../../lib/utils";
import type { DataViewProperty } from "../../types/property.type";
import { isPropertyValueEmpty } from "../../utils/is-property-value-empty";
import { getCardPinIds, resolveCardPins } from "../../utils/resolve-card-pins";
import {
  getShowNameValueClasses,
  getShowNameWrapperClasses,
  resolveShowName,
} from "../../utils/resolve-show-name";
import { Card, CardContent } from "../ui/card";
import { CardPinOverlay } from "./card-pins";
import { DataCell } from "./data-cell";
import { PropertyNameLabel } from "./property-name-label";

export type CardLayout = "list" | "compact";

export interface DataCardProps<TData> {
  /**
   * All property schema - required for formula properties
   */
  allProperties?: readonly DataViewProperty<TData>[];

  /**
   * Card layout mode
   * - "list": Properties stack vertically, one per line (flex-col)
   * - "compact": Properties flow in a wrapping row (flex-wrap)
   * @default "list"
   */
  cardLayout?: CardLayout;

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
   * @default false
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
   * Global default for showing property names.
   * Each property's `showName` overrides this.
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
  cardLayout = "list",
  cardPreview,
  imageHeight,
  fitMedia = false,
  wrapAllProperties = false,
  showPropertyNames = false,
  onCardClick,
  className,
}: DataCardProps<TData>) {
  const isCompact = cardLayout === "compact";
  // Handle cardPreview - resolve through property.id for correct data access
  const previewProperty = cardPreview
    ? (allProperties ?? displayProperties).find((p) => p.id === cardPreview)
    : undefined;
  const previewId = previewProperty?.id ?? cardPreview;
  const previewValue = previewId
    ? (item as Record<string, unknown>)[previewId]
    : null;
  const imageUrl = Array.isArray(previewValue)
    ? previewValue[0]
    : (previewValue as string);

  // Pinned properties (`pin` on the property) render over the media block and
  // leave the card body. Declaration-driven: read from the full schema, not
  // from the visibility-filtered displayProperties. Without a media block
  // there is nothing to overlay, so pins stay in the body.
  const hasMedia = Boolean(cardPreview);
  const pinSource = allProperties ?? displayProperties;
  const pins = useMemo(
    () => (hasMedia ? resolveCardPins(pinSource) : null),
    [hasMedia, pinSource]
  );
  const pinnedIds = useMemo(
    () => (pins ? getCardPinIds(pins) : new Set<string>()),
    [pins]
  );
  const bodyProperties =
    pinnedIds.size > 0
      ? displayProperties.filter((p) => !pinnedIds.has(p.id))
      : displayProperties;
  // Skip empty values before indexing so `isFirst` lands on the first
  // property that actually renders (a nullable formula must not steal it).
  const renderedProperties = bodyProperties.flatMap((property) => {
    const value = (item as Record<string, unknown>)[property.id];
    return isPropertyValueEmpty(property, value, item)
      ? []
      : [{ property, value }];
  });
  const overlay =
    pins && pinnedIds.size > 0 ? (
      <CardPinOverlay
        allProperties={allProperties}
        item={item}
        pins={pins}
        showPropertyNames={showPropertyNames}
      />
    ) : null;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden py-0 transition-all hover:shadow-md",
        onCardClick && "cursor-pointer",
        className
      )}
      onClick={() => onCardClick?.(item)}
    >
      {/* Image Preview - only show if cardPreview is provided */}
      {cardPreview && (
        <div
          className="relative isolate bg-muted"
          style={{ height: imageHeight }}
        >
          {imageUrl ? (
            <Image
              alt={String(
                (item as Record<string, unknown>).title ??
                  (item as Record<string, unknown>).name ??
                  "Preview image"
              )}
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
          {overlay}
        </div>
      )}

      {/* Card Content */}
      <CardContent
        className={cn(
          "flex gap-2 p-3",
          isCompact ? "flex-wrap items-start" : "flex-col"
        )}
      >
        {renderedProperties.map(({ property, value }, propIndex) => {
          const isFirst = propIndex === 0;
          const resolvedShowName = resolveShowName(
            property.showName,
            showPropertyNames
          );
          const resolvedWrap = property.wrap ?? wrapAllProperties;
          const valueClasses = getShowNameValueClasses(resolvedShowName);

          const cell = (
            <DataCell
              allProperties={allProperties}
              item={item}
              property={property}
              showPropertyNames={showPropertyNames}
              value={value}
              wrap={resolvedWrap}
            />
          );

          return (
            <div
              className={cn(
                getShowNameWrapperClasses(resolvedShowName),
                isCompact
                  ? cn("shrink-0", isFirst && "w-full basis-full")
                  : "w-full",
                isFirst && "font-medium",
                (property.type === "select" ||
                  property.type === "multiSelect" ||
                  property.type === "status" ||
                  property.type === "filesMedia") &&
                  "gap-1"
              )}
              key={String(property.id)}
              style={
                isCompact && !isFirst && property.size
                  ? { width: property.size }
                  : undefined
              }
            >
              {resolvedShowName && (
                <PropertyNameLabel
                  name={property.name ?? String(property.id)}
                  resolved={resolvedShowName}
                />
              )}
              {valueClasses ? <div className={valueClasses}>{cell}</div> : cell}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
