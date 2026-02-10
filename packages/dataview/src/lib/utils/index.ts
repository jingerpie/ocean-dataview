// biome-ignore-all lint/performance/noBarrelFile: Intentional public API barrel file
export {
  BADGE_BG_CLASSES,
  BADGE_COLOR_CLASSES,
  getBadgeBgClass,
  getBadgeBgTransparentClass,
  getBadgeClasses,
  getBadgeForegroundVar,
} from "./badge-colors";
export { buildPaginationContext } from "./build-pagination-context";
export type { GroupedDataWithMeta } from "./compute-data";
export { getGroupCounts, groupByProperty } from "./compute-data";
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
export { validateGroupConfig, validateShowAs } from "./validate-group-config";
export { validatePropertyKeys } from "./validate-properties";

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
