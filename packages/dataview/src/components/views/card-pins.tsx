"use client";

import { cn } from "../../lib/utils";
import type {
  CardPinPosition,
  DataViewProperty,
} from "../../types/property.type";
import { isPropertyValueEmpty } from "../../utils/is-property-value-empty";
import {
  CARD_PIN_POSITIONS,
  type CardPinsByPosition,
  type ResolvedCardPin,
} from "../../utils/resolve-card-pins";
import {
  getShowNameValueClasses,
  getShowNameWrapperClasses,
  resolveShowName,
} from "../../utils/resolve-show-name";
import { DataCell } from "./data-cell";
import { PropertyNameLabel } from "./property-name-label";

const POSITION_CLASSES: Record<CardPinPosition, string> = {
  "bottom-left": "bottom-1.5 left-1.5 items-start",
  "bottom-right": "right-1.5 bottom-1.5 items-end",
  "top-left": "top-1.5 left-1.5 items-start",
  "top-right": "top-1.5 right-1.5 items-end",
};

/** Hidden at rest; shown on card hover, on keyboard focus within, and on touch devices. */
const HOVER_REVEAL =
  "opacity-0 transition-opacity group-hover/card:opacity-100 has-[:focus-visible]:opacity-100 pointer-coarse:opacity-100";

interface CardPinOverlayProps<TData> {
  allProperties?: readonly DataViewProperty<TData>[];
  item: TData;
  pins: CardPinsByPosition<TData>;
  /** View-level default for property names; each property's `showName` overrides it. */
  showPropertyNames?: boolean;
}

/**
 * CardPinOverlay - one absolutely positioned stack per corner of the media block.
 * The stack itself ignores pointer events so empty overlay area still reaches
 * the card's own click handler; each pin re-enables them.
 */
export function CardPinOverlay<TData>({
  allProperties,
  item,
  pins,
  showPropertyNames = false,
}: CardPinOverlayProps<TData>) {
  return (
    <>
      {CARD_PIN_POSITIONS.map((position) => {
        const entries = pins[position];
        if (entries.length === 0) {
          return null;
        }
        return (
          <div
            className={cn(
              "pointer-events-none absolute z-10 flex max-w-[calc(100%-0.75rem)] flex-col gap-1",
              POSITION_CLASSES[position]
            )}
            key={position}
          >
            {entries.map((pin) => (
              <CardPin
                allProperties={allProperties}
                item={item}
                key={pin.property.id}
                pin={pin}
                showPropertyNames={showPropertyNames}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

interface CardPinProps<TData> {
  allProperties?: readonly DataViewProperty<TData>[];
  item: TData;
  pin: ResolvedCardPin<TData>;
  showPropertyNames: boolean;
}

/**
 * CardPin - a pinned property rendered exactly as it renders anywhere else
 * (through DataCell), inside a chip that holds up over a photo. Badge-like
 * types and formulas skip the chip (see `shouldChipPin`). The name label
 * follows the same `showName` / `showPropertyNames` rules as the card body.
 */
function CardPin<TData>({
  allProperties,
  item,
  pin,
  showPropertyNames,
}: CardPinProps<TData>) {
  const { chip, hover, property } = pin;
  const value = (item as Record<string, unknown>)[property.id];

  if (isPropertyValueEmpty(property, value, item)) {
    return null;
  }

  const resolvedShowName = resolveShowName(
    property.showName,
    showPropertyNames
  );
  const valueClasses = getShowNameValueClasses(resolvedShowName);
  const cell = (
    <DataCell
      allProperties={allProperties}
      item={item}
      property={property}
      showPropertyNames={showPropertyNames}
      value={value}
      wrap={false}
    />
  );

  return (
    <div
      className={cn(
        "pointer-events-auto max-w-full",
        resolvedShowName && getShowNameWrapperClasses(resolvedShowName),
        chip &&
          "rounded-md bg-card/90 px-1.5 py-0.5 text-xs shadow-sm ring-1 ring-foreground/10 backdrop-blur",
        hover && HOVER_REVEAL
      )}
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
}
