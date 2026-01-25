"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import {
	type DataViewProperty,
	toPropertyMetaArray,
} from "@ocean-dataview/dataview/types";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import {
	DataViewContext,
	type DataViewContextValue,
	type DataViewDefaults,
	type PaginationOutput,
} from "./data-view-context";

export interface DataViewProviderProps<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	data: TData[];
	properties: TProperties;
	children: ReactNode;
	className?: string;
	pagination?: PaginationOutput<TData> | undefined;
	/**
	 * Default values for URL state when URL params are empty
	 * - visibility: Default visible property IDs
	 * - filter: Default filter state
	 * - sort: Default sort state
	 */
	defaults?: DataViewDefaults;
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
	defaults,
}: DataViewProviderProps<TData, TProperties>) {
	// Get all property IDs that CAN be visible (visibility !== false in definition)
	const visiblePropertyIds = useMemo(
		() =>
			properties
				.filter((p) => p.visibility !== false)
				.map((p) => p.id) as TProperties[number]["id"][],
		[properties]
	);

	// Store only user overrides (properties explicitly hidden by user)
	// This is the minimal state - visibility is derived from properties + overrides
	const [hiddenByUser, setHiddenByUser] = useState<
		Set<TProperties[number]["id"]>
	>(() => {
		// Inline computation since visiblePropertyIds memo isn't available yet
		const canBeVisible = properties
			.filter((p) => p.visibility !== false)
			.map((p) => p.id) as TProperties[number]["id"][];

		if (defaults?.visibility) {
			// defaults.visibility = IDs that should be visible
			// hiddenByUser = IDs that should be hidden (inverse)
			const defaultVisible = new Set(defaults.visibility);
			return new Set(canBeVisible.filter((id) => !defaultVisible.has(id)));
		}
		return new Set();
	});

	// Derive visible properties from property definitions + user overrides
	// This automatically handles HMR changes to property definitions
	const propertyVisibility = useMemo(
		() => visiblePropertyIds.filter((id) => !hiddenByUser.has(id)),
		[visiblePropertyIds, hiddenByUser]
	);

	const [excludedPropertyIds, setExcludedPropertyIds] = useState<
		TProperties[number]["id"][]
	>([]);

	// Public API: setPropertyVisibility converts to internal hiddenByUser format
	const setPropertyVisibility = useCallback(
		(visible: TProperties[number]["id"][]) => {
			const visibleSet = new Set(visible);
			// Hidden = all possible visible IDs minus the ones being set as visible
			setHiddenByUser(
				new Set(visiblePropertyIds.filter((id) => !visibleSet.has(id)))
			);
		},
		[visiblePropertyIds]
	);

	const toggleProperty = useCallback(
		(propertyId: TProperties[number]["id"]) => {
			setHiddenByUser((prev) => {
				const next = new Set(prev);
				if (next.has(propertyId)) {
					next.delete(propertyId); // Show
				} else {
					next.add(propertyId); // Hide
				}
				return next;
			});
		},
		[]
	);

	// Show all properties - clear all user overrides
	const showAllProperties = useCallback(() => {
		setHiddenByUser(new Set());
	}, []);

	// Hide all properties that CAN be hidden
	// (properties with visibility: false in definition are already always hidden)
	const hideAllProperties = useCallback(() => {
		setHiddenByUser(new Set(visiblePropertyIds));
	}, [visiblePropertyIds]);

	// Convert properties to covariant PropertyMeta[] for UI components
	const propertyMetas = useMemo(
		() => toPropertyMetaArray(properties),
		[properties]
	);

	const contextValue = useMemo<DataViewContextValue<TData, TProperties>>(
		() => ({
			data,
			properties,
			propertyMetas,
			defaults,
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
			propertyMetas,
			defaults,
			propertyVisibility,
			setPropertyVisibility,
			excludedPropertyIds,
			toggleProperty,
			showAllProperties,
			hideAllProperties,
			pagination,
		]
	);

	return (
		<DataViewContext.Provider value={contextValue}>
			<div className={cn("flex flex-col", className)}>{children}</div>
		</DataViewContext.Provider>
	);
}

// Re-export PaginationOutput for backward compatibility
export type { PaginationOutput } from "./data-view-context";
