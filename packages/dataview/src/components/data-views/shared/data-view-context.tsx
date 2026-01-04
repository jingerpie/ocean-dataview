"use client";

import type { GroupedPaginationOutput } from "@ocean-dataview/dataview/lib/data-views/hooks";
import type { DataViewProperty } from "@ocean-dataview/dataview/lib/data-views/types";
import { createContext, useContext } from "react";

export interface DataViewContextValue<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	// Core data
	data: TData[];
	properties: TProperties;

	// Property visibility state
	propertyVisibility: TProperties[number]["id"][];
	setPropertyVisibility: (visibility: TProperties[number]["id"][]) => void;

	// Excluded properties (e.g., grouped column) - set by view component
	excludedPropertyIds: TProperties[number]["id"][];
	setExcludedPropertyIds: (ids: TProperties[number]["id"][]) => void;

	// Helper methods
	toggleProperty: (propertyId: TProperties[number]["id"]) => void;
	showAllProperties: () => void;
	hideAllProperties: () => void;

	// Grouped pagination
	pagination?: GroupedPaginationOutput<TData> | undefined;
}

export const DataViewContext = createContext<
	// biome-ignore lint/suspicious/noExplicitAny: Generic context - type safety enforced via useDataViewContext<T>()
	DataViewContextValue<any, any> | undefined
>(undefined);

export function useDataViewContext<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
>() {
	const context = useContext(DataViewContext);
	if (!context) {
		throw new Error(
			"useDataViewContext must be used within a DataViewProvider",
		);
	}
	return context as DataViewContextValue<TData, TProperties>;
}
