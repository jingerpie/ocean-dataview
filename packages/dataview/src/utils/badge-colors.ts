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
const BG_TRANSPARENT_CLASSES = buildMap((c) => `bg-badge-${c}-subtle/50`);
const FOREGROUND_VARS = buildMap((c) => `var(--badge-${c}-subtle-foreground)`);
const TEXT_COLORS = buildMap((c) => `!text-badge-${c}-subtle-foreground`);

const FALLBACK_COLOR = "bg-badge-gray-subtle text-badge-gray-subtle-foreground";
const FALLBACK_BG = "bg-badge-gray-subtle";
const FALLBACK_BG_TRANSPARENT = "bg-badge-gray-subtle/50";
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

export function getBadgeForegroundVar(color: BadgeColor = "gray"): string {
  return FOREGROUND_VARS[color] ?? FALLBACK_FOREGROUND_VAR;
}

export function getBadgeTextColorClass(color: BadgeColor = "gray"): string {
  return TEXT_COLORS[color] ?? FALLBACK_TEXT_COLOR;
}
