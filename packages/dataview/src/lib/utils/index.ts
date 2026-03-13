// biome-ignore-all lint/performance/noBarrelFile: Intentional public API barrel file

// Re-export adapter function from types
export { type ParsedGroupConfig, toParsedGroupConfig } from "../../types";
// Keep original validation utilities (used by dataview components)
export {
  validateGroupConfig,
  validateShowAs,
} from "../../validators/valid-group";
export { validatePropertyKeys } from "../../validators/valid-properties";
export {
  BADGE_BG_CLASSES,
  BADGE_COLOR_CLASSES,
  getBadgeBgClass,
  getBadgeBgTransparentClass,
  getBadgeClasses,
  getBadgeForegroundVar,
} from "./badge-colors";
export { buildPaginationContext } from "./build-pagination-context";
export type { GroupedDataWithMeta, GroupingOptions } from "./compute-data";
export { getGroup, groupByProperty } from "./compute-data";
export {
  formatDateForDisplay,
  parseDate,
  parseValue,
  toDateOnlyString,
} from "./date-picker-utils";
export { groupByField } from "./group";
export { paginateData } from "./paginate";
export { searchData } from "./search";
export { sortData } from "./sort";
export { transformData } from "./transform-data";

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
