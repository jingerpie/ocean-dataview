import type { ResolvedShowName } from "../../utils/resolve-show-name";

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
