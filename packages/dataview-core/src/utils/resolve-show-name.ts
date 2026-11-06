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
