"use client";

import { parseAsInteger, useQueryStates } from "nuqs";

/**
 * Hook for managing pagination state in URL
 * Uses nuqs to sync page and page size with URL search params
 */
export function usePaginationParams(defaultPageSize = 10) {
	const [paginationState, setPaginationState] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		pageSize: parseAsInteger.withDefault(defaultPageSize),
	});

	const setPage = (page: number) => {
		setPaginationState({ page });
	};

	const setPageSize = (pageSize: number) => {
		// Reset to page 1 when changing page size
		setPaginationState({ page: 1, pageSize });
	};

	const nextPage = () => {
		setPaginationState({ page: paginationState.page + 1 });
	};

	const prevPage = () => {
		setPaginationState({ page: Math.max(1, paginationState.page - 1) });
	};

	return {
		page: paginationState.page,
		pageSize: paginationState.pageSize,
		setPage,
		setPageSize,
		nextPage,
		prevPage,
	};
}
