import type { BadgeColor } from "../types/property.type";

const BASE_COLORS = [
  "gray",
  "blue",
  "purple",
  "yellow",
  "red",
  "pink",
  "green",
  "teal",
] as const;

function buildMap(fn: (base: string) => string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const base of BASE_COLORS) {
    const value = fn(base);
    map[base] = value;
    map[`${base}-subtle`] = value;
  }
  return map;
}

const COLOR_CLASSES = buildMap(
  (c) => `bg-badge-${c}-subtle text-badge-${c}-subtle-foreground`
);
const BG_CLASSES = buildMap((c) => `bg-badge-${c}-subtle`);
const BG_TRANSPARENT_CLASSES = {
  gray: "bg-badge-gray-subtle/50",
  "gray-subtle": "bg-badge-gray-subtle/50",
  blue: "bg-badge-blue-subtle/50",
  "blue-subtle": "bg-badge-blue-subtle/50",
  purple: "bg-badge-purple-subtle/50",
  "purple-subtle": "bg-badge-purple-subtle/50",
  yellow: "bg-badge-yellow-subtle/50",
  "yellow-subtle": "bg-badge-yellow-subtle/50",
  red: "bg-badge-red-subtle/50",
  "red-subtle": "bg-badge-red-subtle/50",
  pink: "bg-badge-pink-subtle/50",
  "pink-subtle": "bg-badge-pink-subtle/50",
  green: "bg-badge-green-subtle/50",
  "green-subtle": "bg-badge-green-subtle/50",
  teal: "bg-badge-teal-subtle/50",
  "teal-subtle": "bg-badge-teal-subtle/50",
} satisfies Record<BadgeColor, string>;
const BG_VARS = buildMap((c) => `var(--badge-${c}-subtle)`);
const FOREGROUND_VARS = buildMap((c) => `var(--badge-${c}-subtle-foreground)`);
const TEXT_COLORS = {
  gray: "!text-badge-gray-subtle-foreground",
  "gray-subtle": "!text-badge-gray-subtle-foreground",
  blue: "!text-badge-blue-subtle-foreground",
  "blue-subtle": "!text-badge-blue-subtle-foreground",
  purple: "!text-badge-purple-subtle-foreground",
  "purple-subtle": "!text-badge-purple-subtle-foreground",
  yellow: "!text-badge-yellow-subtle-foreground",
  "yellow-subtle": "!text-badge-yellow-subtle-foreground",
  red: "!text-badge-red-subtle-foreground",
  "red-subtle": "!text-badge-red-subtle-foreground",
  pink: "!text-badge-pink-subtle-foreground",
  "pink-subtle": "!text-badge-pink-subtle-foreground",
  green: "!text-badge-green-subtle-foreground",
  "green-subtle": "!text-badge-green-subtle-foreground",
  teal: "!text-badge-teal-subtle-foreground",
  "teal-subtle": "!text-badge-teal-subtle-foreground",
} satisfies Record<BadgeColor, string>;

const FALLBACK_COLOR = "bg-badge-gray-subtle text-badge-gray-subtle-foreground";
const FALLBACK_BG = "bg-badge-gray-subtle";
const FALLBACK_BG_TRANSPARENT = "bg-badge-gray-subtle/50";
const FALLBACK_BG_VAR = "var(--badge-gray-subtle)";
const FALLBACK_FOREGROUND_VAR = "var(--badge-gray-subtle-foreground)";
const FALLBACK_TEXT_COLOR = "!text-badge-gray-subtle-foreground";

export function getBadgeClasses(color: BadgeColor = "gray"): string {
  return COLOR_CLASSES[color] ?? FALLBACK_COLOR;
}

export function getBadgeBgClass(color: BadgeColor = "gray"): string {
  return BG_CLASSES[color] ?? FALLBACK_BG;
}

export function getBadgeBgTransparentClass(color: BadgeColor = "gray"): string {
  return BG_TRANSPARENT_CLASSES[color] ?? FALLBACK_BG_TRANSPARENT;
}

export function getBadgeBgVar(color: BadgeColor = "gray"): string {
  return BG_VARS[color] ?? FALLBACK_BG_VAR;
}

export function getBadgeForegroundVar(color: BadgeColor = "gray"): string {
  return FOREGROUND_VARS[color] ?? FALLBACK_FOREGROUND_VAR;
}

export function getBadgeTextColorClass(color: BadgeColor = "gray"): string {
  return TEXT_COLORS[color] ?? FALLBACK_TEXT_COLOR;
}
