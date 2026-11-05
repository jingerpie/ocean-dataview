import type { PinConfig, PropertyType } from "../../types/property.type";
import { isCardPin } from "../../utils/resolve-card-pins";

export interface SkeletonPropertyLike {
  hidden?: boolean;
  pin?: boolean | PinConfig;
  size?: number;
  type: PropertyType;
}

interface GetSkeletonPropsOptions {
  /**
   * Drop properties that resolve to a card pin. Card skeletons (Board/Gallery)
   * pass `withImage` because pins render over the media, not in the body, and
   * stay in the body when there is no media. Pins on ignored types
   * (`filesMedia`, `button`) stay, matching `resolveCardPins`.
   * @default false
   */
  excludePinned?: boolean;
}

/**
 * Extract visible property types and sizes from a property array for skeleton rendering.
 * Filters out hidden properties and returns the types/sizes arrays that skeleton components expect.
 */
export function getSkeletonProps(
  properties: readonly SkeletonPropertyLike[],
  { excludePinned = false }: GetSkeletonPropsOptions = {}
) {
  const visible = properties.filter(
    (p) => !(p.hidden || (excludePinned && isCardPin(p)))
  );
  return {
    propertyTypes: visible.map((p) => p.type),
    propertySizes: visible.map((p) => p.size),
  };
}
