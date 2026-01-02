"use client";

import type { DataViewProperty } from "@ocean-dataview/ui/lib/data-views/types";
import {
	getGroupCounts,
	groupByProperty as groupDataByProperty,
} from "@ocean-dataview/ui/lib/data-views/utils";
import { cn } from "@ocean-dataview/ui/lib/utils";
import { type ReactNode, useMemo, useState } from "react";
import { BoardColumn } from "./board-column";

export interface BoardColumnCardProps<
	TData,
	TProperties extends
		readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
> {
	/**
	 * Grouped data to display (one group per column)
	 */
	groups: Array<{
		key: string;
		items: TData[];
		count: number;
		sortValue: string | number;
	}>;

	/**
	 * Property definitions
	 */
	properties: TProperties;

	/**
	 * Sub-grouping configuration (optional)
	 */
	subGroup?: {
		/** Property ID to sub-group by (references property.id, not data key) */
		subGroupBy: TProperties[number]["id"];
		/**
		 * How to sub-group the data
		 */
		showAs?:
			| "day"
			| "week"
			| "month"
			| "year"
			| "relative"
			| "group"
			| "option";
		/** Week start day (only for showAs: 'week') */
		startWeekOn?: "monday" | "sunday";
		/** Sort sub-groups by property value (default: 'propertyAscending') */
		sort?: "propertyAscending" | "propertyDescending";
		/** Hide sub-groups with no items (default: true) */
		hideEmptyGroups?: boolean;
		/** Default expanded sub-groups (for uncontrolled mode) */
		defaultExpanded?: string[];
		/** Controlled sub-group expansion state (array of expanded sub-group keys) */
		expandedSubGroups?: string[];
		/** Callback when sub-group expansion changes */
		onExpandedSubGroupsChange?: (groups: string[]) => void;
	};

	/**
	 * Card content renderer
	 */
	cardContent: (item: TData, index: number) => ReactNode;

	/**
	 * Key extractor function
	 */
	keyExtractor: (item: TData, index: number) => string;

	/**
	 * Column header renderer
	 */
	columnHeader?: (groupName: string, count: number) => ReactNode;

	/**
	 * Column background class (color)
	 */
	getColumnBgClass?: (groupName: string) => string | undefined;

	/**
	 * Column width class
	 */
	columnWidth?: string;

	/**
	 * Column footer renderer (for pagination)
	 */
	renderColumnFooter?: (groupKey: string) => ReactNode;

	/**
	 * Additional className
	 */
	className?: string;
}

/**
 * DataBoard - Reusable board component
 * Renders board columns with optional sub-grouping
 */
export function BoardColumnCard<
	TData,
	TProperties extends
		readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({
	groups,
	properties,
	subGroup: subGroupConfig,
	cardContent,
	keyExtractor,
	columnHeader,
	getColumnBgClass,
	columnWidth,
	renderColumnFooter,
	className,
}: BoardColumnCardProps<TData, TProperties>) {
	// Find the subGroupBy property definition
	const subGroupByPropertyDef = useMemo(() => {
		if (!subGroupConfig) return undefined;
		return properties.find((prop) => prop.id === subGroupConfig.subGroupBy);
	}, [properties, subGroupConfig]);

	// Support controlled/uncontrolled pattern for sub-group expansion
	const isControlled = subGroupConfig?.expandedSubGroups !== undefined;
	const [internalExpanded, setInternalExpanded] = useState<string[]>(
		subGroupConfig?.defaultExpanded || [],
	);
	const expandedSubGroups = isControlled
		? (subGroupConfig.expandedSubGroups as string[])
		: internalExpanded;
	const handleExpandedChange = isControlled
		? subGroupConfig.onExpandedSubGroupsChange
		: setInternalExpanded;

	// Compute all possible sub-groups across all data (for hideEmptyGroups: false)
	const allSubGroupKeys = useMemo(() => {
		if (!subGroupConfig) return [];

		// Flatten all items from all groups
		const allItems = groups.flatMap((g) => g.items);

		if (allItems.length === 0) return [];

		const { groups: allSubGroups, sortValues } = groupDataByProperty(
			allItems,
			subGroupConfig.subGroupBy,
			properties,
			subGroupConfig.showAs,
			subGroupConfig.startWeekOn,
		);

		// Get all sub-group keys and sort them
		const subGroupArray = Object.keys(allSubGroups).map((key) => ({
			key,
			sortValue: sortValues[key],
		}));

		// Sort sub-groups
		switch (subGroupConfig.sort ?? "propertyAscending") {
			case "propertyAscending":
				subGroupArray.sort((a, b) => {
					if (
						typeof a.sortValue === "number" &&
						typeof b.sortValue === "number"
					) {
						return a.sortValue - b.sortValue;
					}
					return String(a.sortValue).localeCompare(String(b.sortValue));
				});
				break;
			case "propertyDescending":
				subGroupArray.sort((a, b) => {
					if (
						typeof a.sortValue === "number" &&
						typeof b.sortValue === "number"
					) {
						return b.sortValue - a.sortValue;
					}
					return String(b.sortValue).localeCompare(String(a.sortValue));
				});
				break;
		}

		return subGroupArray.map((sg) => sg.key);
	}, [groups, subGroupConfig, properties]);

	return (
		<div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
			{groups.map((group) => {
				const groupName = group.key;
				const items = group.items;
				const columnBgClass = getColumnBgClass?.(groupName);

				// Compute sub-grouped data if sub-grouping is configured
				let subGroupedDataForColumn:
					| Array<{
							key: string;
							items: TData[];
							count: number;
							sortValue: string | number;
					  }>
					| undefined;

				if (subGroupConfig) {
					const hideEmpty = subGroupConfig.hideEmptyGroups ?? true;

					if (hideEmpty && items.length === 0) {
						// If hiding empty groups and this column has no items, skip sub-grouping
						subGroupedDataForColumn = undefined;
					} else if (!hideEmpty) {
						// Use all possible sub-groups across all columns
						const { groups: subGroups, sortValues } = groupDataByProperty(
							items,
							subGroupConfig.subGroupBy,
							properties,
							subGroupConfig.showAs,
							subGroupConfig.startWeekOn,
						);

						const counts = getGroupCounts(subGroups);

						// Create sub-groups for ALL possible keys (including empty ones)
						subGroupedDataForColumn = allSubGroupKeys.map((key) => ({
							key,
							items: (subGroups[key] as TData[]) || [],
							count: counts[key] ?? 0,
							sortValue: sortValues[key] ?? key,
						}));
					} else {
						// Hide empty sub-groups - only show groups with items in this column
						const { groups: subGroups, sortValues } = groupDataByProperty(
							items,
							subGroupConfig.subGroupBy,
							properties,
							subGroupConfig.showAs,
							subGroupConfig.startWeekOn,
						);

						const counts = getGroupCounts(subGroups);

						let subGroupArray = Object.entries(subGroups).map(
							([key, subItems]) => ({
								key,
								items: subItems as TData[],
								count: counts[key] ?? 0,
								sortValue: sortValues[key] ?? key,
							}),
						);

						// Filter to only non-empty sub-groups
						subGroupArray = subGroupArray.filter((sg) => sg.count > 0);

						// Sort sub-groups
						switch (subGroupConfig.sort ?? "propertyAscending") {
							case "propertyAscending":
								subGroupArray.sort((a, b) => {
									if (
										typeof a.sortValue === "number" &&
										typeof b.sortValue === "number"
									) {
										return a.sortValue - b.sortValue;
									}
									return String(a.sortValue).localeCompare(String(b.sortValue));
								});
								break;
							case "propertyDescending":
								subGroupArray.sort((a, b) => {
									if (
										typeof a.sortValue === "number" &&
										typeof b.sortValue === "number"
									) {
										return b.sortValue - a.sortValue;
									}
									return String(b.sortValue).localeCompare(String(a.sortValue));
								});
								break;
						}

						subGroupedDataForColumn = subGroupArray;
					}
				}

				return (
					<BoardColumn
						key={groupName}
						groupName={groupName}
						items={items}
						cardContent={cardContent}
						keyExtractor={keyExtractor}
						columnHeader={columnHeader}
						columnBgClass={columnBgClass}
						columnWidth={columnWidth}
						subGroupedData={subGroupedDataForColumn}
						subGroupByPropertyDef={subGroupByPropertyDef}
						expandedSubGroups={expandedSubGroups}
						onExpandedSubGroupsChange={handleExpandedChange}
						renderFooter={
							renderColumnFooter
								? () => renderColumnFooter(groupName)
								: undefined
						}
					/>
				);
			})}
		</div>
	);
}
