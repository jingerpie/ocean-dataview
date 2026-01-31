/**
 * Badge variant utilities for property components
 */

const BADGE_COLORS = [
  "gray",
  "blue",
  "purple",
  "yellow",
  "red",
  "pink",
  "green",
  "teal",
] as const;

type BadgeColor = (typeof BADGE_COLORS)[number];

export type BadgeVariant = "secondary" | BadgeColor | `${BadgeColor}-subtle`;

/**
 * Maps property color to badge variant
 * @param color - The color name from property config
 * @param subtle - Whether to use subtle variant (default: true)
 * @returns Badge variant name, defaults to "gray-subtle" or "gray" if not found
 */
export function getBadgeVariant(color?: string, subtle = true): BadgeVariant {
  const baseColor: BadgeColor = BADGE_COLORS.includes(color as BadgeColor)
    ? (color as BadgeColor)
    : "gray";

  return subtle ? `${baseColor}-subtle` : baseColor;
}
