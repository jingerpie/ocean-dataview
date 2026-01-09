"use client";

import {
	cn,
	groupByProperty as groupDataByProperty,
} from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import { type ReactNode, useCallback, useMemo, useRef } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../../ui/accordion";
import { PropertyDisplay } from "../../ui/properties";
import { BoardStickyHeader } from "./board-sticky-header";

/**
 * Extract numeric width from Tailwind class (e.g., "w-80" -> 320px)
 * Tailwind w-N = N * 0.25rem = N * 4px (at 16px base)
 */
function parseColumnWidth(columnWidth: string): number {
	const match = columnWidth.match(/w-(\d+)/);
	if (match) {
		return Number.parseInt(match[1], 10) * 4;
	}
	return 320; // default fallback
}

export interface BoardRowLayoutProps<
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
		displayCount?: string;
		sortValue: string | number;
	}>;

	/**
	 * Property definitions
	 */
	properties: TProperties;

	/**
	 * Sub-grouping configuration
	 */
	subGroup: {
		/** Property ID to sub-group by */
		subGroupBy: TProperties[number]["id"];
		/** How to sub-group the data */
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
		/** Sort sub-groups by property value */
		sort?: "propertyAscending" | "propertyDescending";
		/** Hide sub-groups with no items */
		hideEmptyGroups?: boolean;
		/** Default expanded sub-groups (for uncontrolled mode) */
		defaultExpanded?: string[];
		/** Controlled sub-group expansion state */
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

	/**
	 * Sticky header configuration
	 */
	stickyHeader?: {
		/** Enable portal-based sticky header for page scroll */
		enabled: boolean;
		/** Offset from top of viewport (e.g., navbar height) */
		offset?: number;
	};
}

/**
 * BoardRowLayout - Row-based board layout with full-width sub-groups (Notion-style)
 * Sub-groups span across all columns as horizontal bands
 */
export function BoardRowLayout<
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
	columnWidth = "w-80",
	renderColumnFooter,
	className,
	stickyHeader,
}: BoardRowLayoutProps<TData, TProperties>) {
	// Refs for sticky header
	const headerRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Find the subGroupBy property definition
	const subGroupByPropertyDef = useMemo(() => {
		return properties.find((prop) => prop.id === subGroupConfig.subGroupBy);
	}, [properties, subGroupConfig.subGroupBy]);

	// Collect all unique sub-group keys across all groups and sort them
	const allSubGroupData = useMemo(() => {
		// Flatten all items from all groups
		const allItems = groups.flatMap((g) => g.items);

		if (allItems.length === 0) return [];

		const { groups: subGroups, sortValues } = groupDataByProperty(
			allItems,
			subGroupConfig.subGroupBy,
			properties,
			subGroupConfig.showAs,
			subGroupConfig.startWeekOn,
		);

		// Build sub-group array with counts
		const subGroupArray = Object.entries(subGroups).map(([key, items]) => {
			const count = (items as TData[]).length;
			return {
				key,
				totalCount: count,
				displayCount: count > 99 ? "99+" : String(count),
				sortValue: sortValues[key] ?? key,
			};
		});

		// Sort sub-groups
		const sortOrder = subGroupConfig.sort ?? "propertyAscending";
		subGroupArray.sort((a, b) => {
			const multiplier = sortOrder === "propertyDescending" ? -1 : 1;
			if (typeof a.sortValue === "number" && typeof b.sortValue === "number") {
				return (a.sortValue - b.sortValue) * multiplier;
			}
			return (
				String(a.sortValue).localeCompare(String(b.sortValue)) * multiplier
			);
		});

		return subGroupArray;
	}, [groups, subGroupConfig, properties]);

	// Get items for a specific cell (column group + sub-group)
	const getItemsForCell = useCallback(
		(groupKey: string, subGroupKey: string): TData[] => {
			const group = groups.find((g) => g.key === groupKey);
			if (!group) return [];

			// Group items by sub-group property
			const { groups: subGroups } = groupDataByProperty(
				group.items,
				subGroupConfig.subGroupBy,
				properties,
				subGroupConfig.showAs,
				subGroupConfig.startWeekOn,
			);

			return (subGroups[subGroupKey] as TData[]) || [];
		},
		[groups, subGroupConfig, properties],
	);

	// Filter sub-groups based on hideEmptyGroups
	const visibleSubGroups = useMemo(() => {
		const hideEmpty = subGroupConfig.hideEmptyGroups ?? true;

		if (!hideEmpty) return allSubGroupData;

		// Only show sub-groups that have at least one item in any column
		return allSubGroupData.filter((subGroup) =>
			groups.some(
				(group) => getItemsForCell(group.key, subGroup.key).length > 0,
			),
		);
	}, [
		allSubGroupData,
		groups,
		subGroupConfig.hideEmptyGroups,
		getItemsForCell,
	]);

	const columnWidthPx = parseColumnWidth(columnWidth);

	return (
		<div className={cn("overflow-clip", className)}>
			{/* Portal-based sticky header */}
			{stickyHeader?.enabled && (
				<BoardStickyHeader
					groups={groups}
					columnWidthPx={columnWidthPx}
					columnHeader={columnHeader}
					getColumnBgClass={getColumnBgClass}
					enabled={stickyHeader.enabled}
					headerRef={headerRef}
					containerRef={containerRef}
					offset={stickyHeader.offset}
				/>
			)}

			<div ref={containerRef} className="overflow-x-auto pb-4">
				<div className="min-w-fit">
					{/* Original column headers */}
					<div
						ref={headerRef}
						className="sticky top-0 z-10 flex gap-3 bg-background"
					>
						{groups.map((group) => (
							<div
								key={group.key}
								className={cn(
									"flex-shrink-0 pb-3",
									getColumnBgClass?.(group.key) || "bg-muted/30",
								)}
								style={{ width: columnWidthPx }}
							>
								{columnHeader ? (
									columnHeader(group.key, group.count)
								) : (
									<div className="flex items-center gap-2">
										<span className="font-semibold text-sm">{group.key}</span>
										<span className="text-muted-foreground text-xs">
											{group.displayCount ?? group.count}
										</span>
									</div>
								)}
							</div>
						))}
					</div>

					{/* Sub-group rows */}
					<Accordion
						multiple
						value={subGroupConfig.expandedSubGroups}
						defaultValue={subGroupConfig.defaultExpanded}
						onValueChange={subGroupConfig.onExpandedSubGroupsChange}
					>
						{visibleSubGroups.map((subGroup) => (
							<AccordionItem
								key={subGroup.key}
								value={subGroup.key}
								className="border-b-0"
							>
								<AccordionTrigger className="flex-initial py-2 hover:no-underline">
									<div className="flex items-center gap-2">
										{subGroupByPropertyDef ? (
											<PropertyDisplay
												value={subGroup.key}
												property={subGroupByPropertyDef}
												item={
													{ [subGroupByPropertyDef.id]: subGroup.key } as TData
												}
											/>
										) : (
											<span className="font-medium text-sm">
												{subGroup.key}
											</span>
										)}
										<span className="font-medium text-muted-foreground text-xs">
											{subGroup.displayCount}
										</span>
									</div>
								</AccordionTrigger>
								<AccordionContent className="gap-0 pb-0">
									{/* Card grid for this sub-group */}
									<div className="flex gap-3">
										{groups.map((group) => {
											const cellItems = getItemsForCell(
												group.key,
												subGroup.key,
											);
											const columnBgClass = getColumnBgClass?.(group.key);

											return (
												<div
													key={group.key}
													className={cn(
														"flex-shrink-0 rounded-lg",
														columnBgClass || "bg-muted/10",
													)}
													style={{ width: columnWidthPx }}
												>
													{cellItems.length > 0 ? (
														<div className="flex flex-col gap-2">
															{cellItems.map((item, index) => (
																<div key={keyExtractor(item, index)}>
																	{cardContent(item, index)}
																</div>
															))}
														</div>
													) : (
														// Empty cell placeholder - maintains column alignment
														<div className="min-h-10" />
													)}
												</div>
											);
										})}
									</div>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>

					{/* Column footers (pagination) */}
					{renderColumnFooter && (
						<div className="mt-4 flex gap-3">
							{groups.map((group) => (
								<div
									key={group.key}
									className="flex-shrink-0"
									style={{ width: columnWidthPx }}
								>
									{renderColumnFooter(group.key)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
