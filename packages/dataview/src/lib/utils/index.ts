export { buildPaginationContext } from "./build-pagination-context";
export type { GroupedDataWithMeta } from "./compute-data";
export { getGroupCounts, groupByProperty } from "./compute-data";
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
