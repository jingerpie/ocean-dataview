// Export all property types

// Export action types
export type { Action } from "./actions";
// Export chart types
export * from "./chart-types";
// Export pagination types
export type { PaginationContext } from "./pagination";
export * from "./property-types";

// Pagination result interface
export interface PaginationResult<T> {
	data: T[];
	totalPages: number;
	currentPage: number;
	hasNext: boolean;
	hasPrev: boolean;
	totalItems: number;
	pageSize: number;
}

// Grouped data interface
export interface GroupedData<T> {
	[key: string]: T[];
}
