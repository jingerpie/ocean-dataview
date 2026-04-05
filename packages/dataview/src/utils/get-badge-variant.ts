/**
 * Badge variant utilities for property components
 */

import type { BadgeColor } from "../types/property.type";

export type BadgeVariant = "secondary" | BadgeColor;

const BADGE_VARIANT_SET: ReadonlySet<string> = new Set<BadgeColor>([
  "gray",
  "gray-subtle",
  "blue",
  "blue-subtle",
  "purple",
  "purple-subtle",
  "yellow",
  "yellow-subtle",
  "red",
  "red-subtle",
  "pink",
  "pink-subtle",
  "green",
  "green-subtle",
  "teal",
  "teal-subtle",
]);

/**
 * Maps property color to badge variant.
 * The color string is the source of truth:
 * - "blue" → "blue" (solid badge)
 * - "blue-subtle" → "blue-subtle" (subtle badge)
 * - undefined → "gray-subtle" (default)
 */
export function getBadgeVariant(color?: BadgeColor): BadgeVariant {
  if (!color) {
    return "gray-subtle";
  }

  if (BADGE_VARIANT_SET.has(color)) {
    return color as BadgeVariant;
  }

  return "gray-subtle";
}
