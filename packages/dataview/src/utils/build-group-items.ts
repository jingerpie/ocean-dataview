import type { GroupedDataItem } from "../types/group.type";
import type { GroupCounts } from "../types/pagination-types";
import type { BadgeColor, DataViewProperty } from "../types/property.type";

export interface BuildGroupItemsOptions {
  /** Drop groups with zero items */
  hideEmpty?: boolean;
  sortOrder?: "asc" | "desc";
  /** Server-provided sort value per group key (falls back to the key) */
  sortValues?: Record<string, string | number>;
}

/**
 * Build sorted group shells (no items yet) from server group counts.
 * Items are loaded per group by the view.
 */
export function buildGroupItems<TData>(
  counts: GroupCounts | undefined,
  { hideEmpty = false, sortOrder = "asc", sortValues }: BuildGroupItemsOptions
): GroupedDataItem<TData>[] {
  if (!counts) {
    return [];
  }

  return Object.entries(counts)
    .map(([key, countInfo]) => ({
      key,
      items: [] as TData[],
      count: countInfo.count,
      displayCount: countInfo.hasMore ? "99+" : String(countInfo.count),
      sortValue: sortValues?.[key] ?? key,
    }))
    .filter((group) => !hideEmpty || group.count > 0)
    .sort((a, b) => {
      const result =
        typeof a.sortValue === "number" && typeof b.sortValue === "number"
          ? a.sortValue - b.sortValue
          : String(a.sortValue).localeCompare(String(b.sortValue));
      return sortOrder === "desc" ? -result : result;
    });
}

/** Options (value + color) a select-like property can be grouped by. */
export function getGroupOptions(
  property: DataViewProperty<unknown> | undefined
): { color?: BadgeColor; value: string }[] {
  if (!property) {
    return [];
  }
  if (property.type === "select" || property.type === "multiSelect") {
    return property.config?.options ?? [];
  }
  if (property.type === "status") {
    return (property.config?.groups ?? []).flatMap((group) =>
      group.options.map((value) => ({ value, color: group.color }))
    );
  }
  return [];
}
