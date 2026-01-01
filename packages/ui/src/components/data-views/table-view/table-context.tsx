"use client";

import type { GroupedPaginationOutput } from "@ocean-dataview/ui/lib/data-views/hooks";
import type { DataViewProperty } from "@ocean-dataview/ui/lib/data-views/types";
import { createContext, useContext } from "react";

export interface TableContextValue<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	// Core data
	data: TData[];
	properties: TProperties;

	// Column visibility state
	propertyVisibility: TProperties[number]["id"][];
	setPropertyVisibility: (visibility: TProperties[number]["id"][]) => void;

	// Excluded properties (e.g., grouped column) - set by TableView
	excludedPropertyIds: TProperties[number]["id"][];
	setExcludedPropertyIds: (ids: TProperties[number]["id"][]) => void;

	// Helper methods
	toggleProperty: (propertyId: TProperties[number]["id"]) => void;
	showAllProperties: () => void;
	hideAllProperties: () => void;

	// Optional pagination data
	pagination?: GroupedPaginationOutput<TData> | undefined;
}

export const TableContext = createContext<
	TableContextValue<any, any> | undefined
>(undefined);

export function useTableContext<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
>() {
	const context = useContext(TableContext);
	if (!context) {
		throw new Error("TableView must be used within a TableProvider");
	}
	return context as TableContextValue<TData, TProperties>;
}
