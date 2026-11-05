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

/**
 * Base `Badge` variants have no `--badge-*` token pair; they resolve to the
 * semantic theme tokens the Badge component itself uses.
 */
const BASE_VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const;

type BaseVariant = (typeof BASE_VARIANTS)[number];

const BASE_VARIANT_CLASSES: Record<BaseVariant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive/10 text-destructive",
  outline: "border-border text-foreground",
  ghost: "text-foreground",
  link: "text-primary",
};
const BASE_VARIANT_BG: Record<BaseVariant, string> = {
  default: "bg-primary",
  secondary: "bg-secondary",
  destructive: "bg-destructive/10",
  outline: "bg-transparent",
  ghost: "bg-transparent",
  link: "bg-transparent",
};
const BASE_VARIANT_BG_TRANSPARENT: Record<BaseVariant, string> = {
  default: "bg-primary/50",
  secondary: "bg-secondary/50",
  destructive: "bg-destructive/5",
  outline: "bg-transparent",
  ghost: "bg-transparent",
  link: "bg-transparent",
};
const BASE_VARIANT_BG_VAR: Record<BaseVariant, string> = {
  default: "var(--primary)",
  secondary: "var(--secondary)",
  destructive: "color-mix(in oklab, var(--destructive) 10%, transparent)",
  outline: "transparent",
  ghost: "transparent",
  link: "transparent",
};
const BASE_VARIANT_FG_VAR: Record<BaseVariant, string> = {
  default: "var(--primary-foreground)",
  secondary: "var(--secondary-foreground)",
  destructive: "var(--destructive)",
  outline: "var(--foreground)",
  ghost: "var(--foreground)",
  link: "var(--primary)",
};
const BASE_VARIANT_TEXT: Record<BaseVariant, string> = {
  default: "!text-primary-foreground",
  secondary: "!text-secondary-foreground",
  destructive: "!text-destructive",
  outline: "!text-foreground",
  ghost: "!text-foreground",
  link: "!text-primary",
};

const COLOR_CLASSES: Record<string, string> = {
  ...buildMap((c) => `bg-badge-${c}-subtle text-badge-${c}-subtle-foreground`),
  ...BASE_VARIANT_CLASSES,
};
const BG_CLASSES: Record<string, string> = {
  ...buildMap((c) => `bg-badge-${c}-subtle`),
  ...BASE_VARIANT_BG,
};
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
  ...BASE_VARIANT_BG_TRANSPARENT,
} satisfies Record<BadgeColor, string>;
const BG_VARS: Record<string, string> = {
  ...buildMap((c) => `var(--badge-${c}-subtle)`),
  ...BASE_VARIANT_BG_VAR,
};
const FOREGROUND_VARS: Record<string, string> = {
  ...buildMap((c) => `var(--badge-${c}-subtle-foreground)`),
  ...BASE_VARIANT_FG_VAR,
};
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
  ...BASE_VARIANT_TEXT,
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
