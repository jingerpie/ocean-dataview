import type { PaginationResult } from "../../types";

/**
 * Client-side pagination utility
 * Slices the data array for the current page and returns pagination metadata
 */
export function paginateData<T>(
	data: T[],
	page = 1,
	pageSize = 10
): PaginationResult<T> {
	const totalItems = data.length;
	const totalPages = Math.ceil(totalItems / pageSize);

	// Ensure page is within valid range
	const currentPage = Math.max(1, Math.min(page, totalPages || 1));

	const startIndex = (currentPage - 1) * pageSize;
	const endIndex = startIndex + pageSize;

	const paginatedData = data.slice(startIndex, endIndex);

	return {
		data: paginatedData,
		totalPages,
		currentPage,
		hasNext: currentPage < totalPages,
		hasPrev: currentPage > 1,
		totalItems,
		pageSize,
	};
}
