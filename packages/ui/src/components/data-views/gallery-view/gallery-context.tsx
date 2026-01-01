"use client";

import type { GroupedPaginationOutput } from "@ocean-dataview/ui/lib/data-views/hooks";
import type { DataViewProperty } from "@ocean-dataview/ui/lib/data-views/types";
import { createContext, useContext } from "react";

export interface GalleryContextValue<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	// Core data
	data: TData[];
	properties: TProperties;

	// Property visibility state
	propertyVisibility: TProperties[number]["id"][];
	setPropertyVisibility: (visibility: TProperties[number]["id"][]) => void;

	// Excluded properties (e.g., grouped column) - set by GalleryView
	excludedPropertyIds: TProperties[number]["id"][];
	setExcludedPropertyIds: (ids: TProperties[number]["id"][]) => void;

	// Helper methods
	toggleProperty: (propertyId: TProperties[number]["id"]) => void;
	showAllProperties: () => void;
	hideAllProperties: () => void;

	// Grouped pagination
	pagination?: GroupedPaginationOutput<TData> | undefined;
}

export const GalleryContext = createContext<
	GalleryContextValue<any, any> | undefined
>(undefined);

export function useGalleryContext<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
>() {
	const context = useContext(GalleryContext);
	if (!context) {
		throw new Error("GalleryView must be used within a GalleryProvider");
	}
	return context as GalleryContextValue<TData, TProperties>;
}
