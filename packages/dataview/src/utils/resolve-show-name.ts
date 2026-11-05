import type {
  ShowNameAlign,
  ShowNameConfig,
  ShowNameLayout,
} from "../types/property.type";

export interface ResolvedShowName {
  align: ShowNameAlign;
  layout: ShowNameLayout;
}

/**
 * Resolve a property's `showName` against the view-level `showPropertyNames`
 * default. Returns `null` when the name should not render.
 *
 * - `true` / `{}` → vertical (current behaviour)
 * - `false` → hidden
 * - `undefined` → follows `fallback`
 */
export function resolveShowName(
  showName: boolean | ShowNameConfig | undefined,
  fallback: boolean
): ResolvedShowName | null {
  const enabled = showName ?? fallback;
  if (!enabled) {
    return null;
  }
  const config: ShowNameConfig = typeof showName === "object" ? showName : {};
  return {
    layout: config.layout ?? "vertical",
    align: config.align ?? "end",
  };
}

/**
 * Classes for the element wrapping the value in a horizontal layout, or
 * `null` when the value should render bare (vertical). Block-level cells
 * (text, rollup text) take the remaining width, so `"end"` right-aligns.
 */
export function getShowNameValueClasses(
  resolved: ResolvedShowName | null
): string | null {
  if (resolved?.layout !== "horizontal") {
    return null;
  }
  return resolved.align === "start" ? "min-w-0" : "min-w-0 flex-1 text-right";
}

/** Flex classes for the wrapper that holds the name label and the value. */
export function getShowNameWrapperClasses(
  resolved: ResolvedShowName | null
): string {
  if (resolved?.layout !== "horizontal") {
    return "flex min-w-0 flex-col items-start";
  }
  return resolved.align === "start"
    ? "flex min-w-0 items-baseline gap-2"
    : "flex min-w-0 items-baseline justify-between gap-2";
}
