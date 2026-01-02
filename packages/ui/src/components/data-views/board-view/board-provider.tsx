"use client";

import type { GroupedPaginationOutput } from "@ocean-dataview/ui/lib/data-views/hooks/use-group-pagination";
import type { DataViewProperty } from "@ocean-dataview/ui/lib/data-views/types";
import { cn } from "@ocean-dataview/ui/lib/utils";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	BoardContext,
	type BoardContextValue,
	type GroupCounts,
	type GroupCountsWithSubGroups,
} from "./board-context";

export interface BoardProviderProps<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	data: TData[];
	properties: TProperties;
	/** Pagination state from useGroupPagination (for server-side grouping) */
	pagination?: GroupedPaginationOutput<TData>;
	/** Group counts from getGroup API (for rendering all column headers) */
	counts?: GroupCounts | GroupCountsWithSubGroups;
	children: ReactNode;
	className?: string;
}

export function BoardProvider<
	TData = unknown,
	TProperties extends
		readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
>({
	data,
	properties,
	pagination,
	counts,
	children,
	className,
}: BoardProviderProps<TData, TProperties>) {
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

	const contextValue = useMemo<BoardContextValue<TData, TProperties>>(
		() => ({
			data,
			properties,
			pagination,
			counts,
			propertyVisibility,
			setPropertyVisibility,
			excludedPropertyIds,
			setExcludedPropertyIds,
			toggleProperty,
			showAllProperties,
			hideAllProperties,
		}),
		[
			data,
			properties,
			pagination,
			counts,
			propertyVisibility,
			excludedPropertyIds,
			toggleProperty,
			showAllProperties,
			hideAllProperties,
		],
	);

	return (
		<BoardContext.Provider value={contextValue}>
			<div className={cn("flex flex-col gap-3", className)}>{children}</div>
		</BoardContext.Provider>
	);
}
