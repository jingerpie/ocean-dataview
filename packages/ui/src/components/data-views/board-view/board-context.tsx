"use client";

import type { GroupedPaginationOutput } from "@ocean-dataview/ui/lib/data-views/hooks/use-group-pagination";
import type { DataViewProperty } from "@ocean-dataview/ui/lib/data-views/types";
import { createContext, useContext } from "react";

/** Single-level group counts */
export type GroupCounts = Record<string, { count: number; hasMore: boolean }>;

/** Two-level group counts (with sub-groups) */
export type GroupCountsWithSubGroups = Record<
	string,
	{
		count: number;
		hasMore: boolean;
		subGroups: Record<string, { count: number; hasMore: boolean }>;
	}
>;

export interface BoardContextValue<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	// Core data
	data: TData[];
	properties: TProperties;

	// Pagination support (for server-side grouping)
	pagination?: GroupedPaginationOutput<TData>;
	counts?: GroupCounts | GroupCountsWithSubGroups;

	// Property visibility state
	propertyVisibility: TProperties[number]["id"][];
	setPropertyVisibility: (visibility: TProperties[number]["id"][]) => void;

	// Excluded properties (e.g., grouped/sub-grouped columns) - set by BoardView
	excludedPropertyIds: TProperties[number]["id"][];
	setExcludedPropertyIds: (ids: TProperties[number]["id"][]) => void;

	// Helper methods
	toggleProperty: (propertyId: TProperties[number]["id"]) => void;
	showAllProperties: () => void;
	hideAllProperties: () => void;
}

export const BoardContext = createContext<
	BoardContextValue<any, any> | undefined
>(undefined);

export function useBoardContext<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
>() {
	const context = useContext(BoardContext);
	if (!context) {
		throw new Error("BoardView must be used within a BoardProvider");
	}
	return context as BoardContextValue<TData, TProperties>;
}
