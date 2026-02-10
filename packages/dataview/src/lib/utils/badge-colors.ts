import type { BadgeColor } from "../../types/property.type";

export const BADGE_COLOR_CLASSES: Record<BadgeColor, string> = {
  gray: "bg-badge-gray-subtle text-badge-gray-subtle-foreground",
  blue: "bg-badge-blue-subtle text-badge-blue-subtle-foreground",
  purple: "bg-badge-purple-subtle text-badge-purple-subtle-foreground",
  yellow: "bg-badge-yellow-subtle text-badge-yellow-subtle-foreground",
  red: "bg-badge-red-subtle text-badge-red-subtle-foreground",
  pink: "bg-badge-pink-subtle text-badge-pink-subtle-foreground",
  green: "bg-badge-green-subtle text-badge-green-subtle-foreground",
  teal: "bg-badge-teal-subtle text-badge-teal-subtle-foreground",
};

export const BADGE_BG_CLASSES: Record<BadgeColor, string> = {
  gray: "bg-badge-gray-subtle",
  blue: "bg-badge-blue-subtle",
  purple: "bg-badge-purple-subtle",
  yellow: "bg-badge-yellow-subtle",
  red: "bg-badge-red-subtle",
  pink: "bg-badge-pink-subtle",
  green: "bg-badge-green-subtle",
  teal: "bg-badge-teal-subtle",
};

export const BADGE_FOREGROUND_VAR_STRINGS: Record<BadgeColor, string> = {
  gray: "var(--badge-gray-subtle-foreground)",
  blue: "var(--badge-blue-subtle-foreground)",
  purple: "var(--badge-purple-subtle-foreground)",
  yellow: "var(--badge-yellow-subtle-foreground)",
  red: "var(--badge-red-subtle-foreground)",
  pink: "var(--badge-pink-subtle-foreground)",
  green: "var(--badge-green-subtle-foreground)",
  teal: "var(--badge-teal-subtle-foreground)",
};

export const BADGE_BG_TRANSPARENT_CLASSES: Record<BadgeColor, string> = {
  gray: "bg-badge-gray-subtle/50",
  blue: "bg-badge-blue-subtle/50",
  purple: "bg-badge-purple-subtle/50",
  yellow: "bg-badge-yellow-subtle/50",
  red: "bg-badge-red-subtle/50",
  pink: "bg-badge-pink-subtle/50",
  green: "bg-badge-green-subtle/50",
  teal: "bg-badge-teal-subtle/50",
};

export function getBadgeClasses(color: BadgeColor = "gray"): string {
  return BADGE_COLOR_CLASSES[color] || BADGE_COLOR_CLASSES.gray;
}

export function getBadgeBgClass(color: BadgeColor = "gray"): string {
  return BADGE_BG_CLASSES[color] || BADGE_BG_CLASSES.gray;
}

export function getBadgeBgTransparentClass(color: BadgeColor = "gray"): string {
  return (
    BADGE_BG_TRANSPARENT_CLASSES[color] || BADGE_BG_TRANSPARENT_CLASSES.gray
  );
}

export function getBadgeForegroundVar(color: BadgeColor = "gray"): string {
  return (
    BADGE_FOREGROUND_VAR_STRINGS[color] || BADGE_FOREGROUND_VAR_STRINGS.gray
  );
}
