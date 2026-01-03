"use client";

import type { GroupedPaginationOutput } from "@ocean-dataview/ui/lib/data-views/hooks";
import type { DataViewProperty } from "@ocean-dataview/ui/lib/data-views/types";
import { cn } from "@ocean-dataview/ui/lib/utils";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	DataViewContext,
	type DataViewContextValue,
} from "./data-view-context";

export interface DataViewProviderProps<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	data: TData[];
	properties: TProperties;
	children: ReactNode;
	className?: string;
	pagination?: GroupedPaginationOutput<TData> | undefined;
}

export function DataViewProvider<
	TData = unknown,
	TProperties extends
		readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
>({
	data,
	properties,
	children,
	className,
	pagination,
}: DataViewProviderProps<TData, TProperties>) {
	const [propertyVisibility, setPropertyVisibility] = useState<
		TProperties[number]["id"][]
	>(() => properties.map((prop) => prop.id));

	const [excludedPropertyIds, setExcludedPropertyIds] = useState<
		TProperties[number]["id"][]
	>([]);

	// Sync visibility when properties change
	useEffect(() => {
		setPropertyVisibility((prev) => {
			const validIds = properties.map((p) => p.id);
			const filtered = prev.filter((id) => validIds.includes(id));
			return filtered.length > 0 ? filtered : validIds;
		});
	}, [properties]);

	const toggleProperty = useCallback(
		(propertyId: TProperties[number]["id"]) => {
			setPropertyVisibility((prev) => {
				const isVisible = prev.includes(propertyId);
				if (isVisible) {
					return prev.filter((id) => id !== propertyId);
				}
				const allIds = properties.map((p) => p.id);
				return allIds.filter((id) => prev.includes(id) || id === propertyId);
			});
		},
		[properties],
	);

	const showAllProperties = useCallback(() => {
		setPropertyVisibility(properties.map((prop) => prop.id));
	}, [properties]);

	const hideAllProperties = useCallback(() => {
		setPropertyVisibility([]);
	}, []);

	const contextValue = useMemo<DataViewContextValue<TData, TProperties>>(
		() => ({
			data,
			properties,
			propertyVisibility,
			setPropertyVisibility,
			excludedPropertyIds,
			setExcludedPropertyIds,
			toggleProperty,
			showAllProperties,
			hideAllProperties,
			pagination,
		}),
		[
			data,
			properties,
			propertyVisibility,
			excludedPropertyIds,
			toggleProperty,
			showAllProperties,
			hideAllProperties,
			pagination,
		],
	);

	return (
		<DataViewContext.Provider value={contextValue}>
			<div className={cn("flex flex-col gap-3", className)}>{children}</div>
		</DataViewContext.Provider>
	);
}
