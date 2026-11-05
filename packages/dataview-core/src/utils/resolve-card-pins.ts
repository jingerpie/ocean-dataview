import type {
  CardPinPosition,
  DataViewProperty,
  PinConfig,
  PropertyType,
  RollupConfig,
} from "../types/property.type";

export const CARD_PIN_POSITIONS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const satisfies readonly CardPinPosition[];

const DEFAULT_POSITION: CardPinPosition = "top-left";

export interface ResolvedCardPin<T> {
  /** Wrap in the default chip; false when the type draws its own chrome. */
  chip: boolean;
  /** Hidden until the card is hovered or a descendant has focus. */
  hover: boolean;
  position: CardPinPosition;
  property: DataViewProperty<T>;
}

export type CardPinsByPosition<T> = Record<
  CardPinPosition,
  ResolvedCardPin<T>[]
>;

interface PinnableLike {
  pin?: boolean | PinConfig;
}

interface CardPinnableLike extends PinnableLike {
  type: PropertyType;
}

/** Types that make no sense as a media overlay; `pin` on them is ignored for cards. */
const CARD_PIN_IGNORED_TYPES: ReadonlySet<PropertyType> = new Set([
  "filesMedia",
  "button",
]);

/** Types whose renderer already draws a badge/pill; no chip around them. */
const SELF_STYLED_TYPES: ReadonlySet<PropertyType> = new Set([
  "select",
  "multiSelect",
  "status",
]);

/**
 * Whether a pinned property gets the default chip. Badge-like types (select,
 * multiSelect, status, and rollups of those) and formulas render their own
 * chrome and go bare; plain values (text, number, date, checkbox, …) need
 * the chip to stay readable over a photo.
 */
export function shouldChipPin<T>(property: DataViewProperty<T>): boolean {
  if (property.type === "formula" || SELF_STYLED_TYPES.has(property.type)) {
    return false;
  }
  if (property.type === "rollup") {
    const config = property.config as RollupConfig;
    return !SELF_STYLED_TYPES.has(config.type);
  }
  return true;
}

/** `true` or any object (including `{}`) counts as pinned. */
export function isPinned(property: PinnableLike): boolean {
  return Boolean(property.pin);
}

/**
 * Whether `pin` on this property actually produces a card pin: pinned and
 * not one of the ignored types. Card skeletons use this to mirror the body.
 */
export function isCardPin(property: CardPinnableLike): boolean {
  return isPinned(property) && !CARD_PIN_IGNORED_TYPES.has(property.type);
}

/** The object form of `pin`, or `{}` when `pin` is boolean or absent. */
export function getPinConfig(property: PinnableLike): PinConfig {
  return typeof property.pin === "object" ? property.pin : {};
}

/**
 * Group pinned properties by card corner. Placement defaults are identical
 * for every type: top-left, always visible. Chip wrapping follows the type
 * (see `shouldChipPin`). Declaration order is preserved within a corner.
 * Ignores `filesMedia`/`button`.
 */
export function resolveCardPins<T>(
  properties: readonly DataViewProperty<T>[]
): CardPinsByPosition<T> {
  const result: CardPinsByPosition<T> = {
    "top-left": [],
    "top-right": [],
    "bottom-left": [],
    "bottom-right": [],
  };

  for (const property of properties) {
    if (!isCardPin(property)) {
      continue;
    }
    const config = getPinConfig(property);
    const position = config.position ?? DEFAULT_POSITION;
    result[position].push({
      chip: shouldChipPin(property),
      hover: config.hover ?? false,
      position,
      property,
    });
  }

  return result;
}

/** Ids of every property that resolved to a card pin (for body exclusion). */
export function getCardPinIds<T>(pins: CardPinsByPosition<T>): Set<string> {
  return new Set(
    CARD_PIN_POSITIONS.flatMap((position) =>
      pins[position].map((pin) => pin.property.id)
    )
  );
}
