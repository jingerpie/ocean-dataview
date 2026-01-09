"use client";

import {
	buildPaginationContext,
	transformData,
} from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import { AlertCircle } from "lucide-react";
import type { GroupedDataItem } from "../../../hooks";
import { useDisplayProperties, useViewSetup } from "../../../hooks";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import { Accordion } from "../../ui/accordion";
import { GroupSection } from "../../ui/group-section";
import { type PaginationMode, renderPagination } from "../../ui/paginations";
import { ListRow } from "./list-row";

export interface ListViewProps<
	TData,
	TProperties extends
		readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
> {
	/**
	 * Layout configuration
	 */
	layout?: {
		showDividers?: boolean;
	};

	/**
	 * View configuration
	 */
	view?: {
		propertyVisibility?: TProperties[number]["id"][];

		/**
		 * Group By configuration - creates collapsible groups in list
		 */
		group?: {
			/** Property ID to group by (references property.id, not data key) */
			groupBy: TProperties[number]["id"];
			/**
			 * How to group the data:
			 * - For date properties: 'day' | 'week' | 'month' | 'year' | 'relative' (default: 'relative')
			 * - For status properties: 'option' (group by status value) | 'group' (group by status group like todo/inProgress/complete) (default: 'option')
			 * - For select/multi-select: 'option' (group by option value) (default behavior)
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
			/** Sort groups by property value (default: 'propertyAscending') */
			sort?: "propertyAscending" | "propertyDescending";
			/** Hide groups with no items (default: true) */
			hideEmptyGroups?: boolean;
			/** Display aggregation counts in group headers (default: true) */
			showAggregation?: boolean;
			/** Controlled expansion state (array of expanded group keys) */
			expandedGroups?: string[];
			/** Callback when expansion state changes */
			onExpandedChange?: (groups: string[]) => void;
		};
	};

	/**
	 * Item click handler
	 */
	onItemClick?: (item: TData) => void;

	/**
	 * Pagination mode for the list.
	 * - "page": Classic prev/next pagination with "Showing X-Y"
	 * - "loadMore": "Load more" button
	 * - "infiniteScroll": Auto-load on scroll
	 * - undefined: No pagination UI
	 *
	 * For grouped lists: renders inside each group
	 * For flat lists: renders below the list
	 */
	pagination?: PaginationMode;

	/**
	 * Additional className
	 */
	className?: string;
}

/**
 * ListView with property-based display
 * Auto-generates list item display from properties
 */
export function ListView<
	TData,
	TProperties extends
		readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({
	layout = {},
	view = {},
	onItemClick,
	pagination,
	className,
}: ListViewProps<TData, TProperties>) {
	// Get data and properties from context
	const {
		data,
		properties,
		propertyVisibility,
		pagination: contextPagination,
		setExcludedPropertyIds,
		setPropertyVisibility,
	} = useDataViewContext<TData, TProperties>();

	const { showDividers = true } = layout;
	const { propertyVisibility: viewPropertyVisibility, group: groupBy } = view;

	// Use shared view setup hook
	const {
		transformedData,
		groupConfig,
		groupedData,
		groupByProperty,
		validationError,
		propertyValidationError,
	} = useViewSetup({
		data: data as TData[],
		properties,
		groupBy: groupBy
			? {
					groupBy: String(groupBy.groupBy),
					showAs: groupBy.showAs,
					startWeekOn: groupBy.startWeekOn,
					sort: groupBy.sort,
					hideEmptyGroups: groupBy.hideEmptyGroups,
				}
			: undefined,
		viewPropertyVisibility,
		contextPagination,
		setExcludedPropertyIds,
		setPropertyVisibility,
	});

	// Use shared hook for display properties filtering
	const displayProperties = useDisplayProperties(
		properties,
		propertyVisibility,
		groupConfig ? [groupConfig.groupBy] : undefined,
	);

	// Transform flat data for non-grouped view (must be before early returns)
	const transformedFlatData = transformedData;

	// Error state
	if (validationError || propertyValidationError) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 p-8">
				<AlertCircle className="mb-4 h-12 w-12 text-destructive" />
				<p className="font-medium text-destructive">
					Invalid list configuration
				</p>
				<p className="mt-2 text-muted-foreground text-sm">
					{validationError || propertyValidationError}
				</p>
			</div>
		);
	}

	// GROUPED VIEW: Render using Accordion for collapsible groups
	// Note: Check grouped view before empty state, because with lazy loading
	// data might be empty but we still want to show group headers with counts
	if (groupBy && groupedData) {
		return (
			<div className={className}>
				<Accordion
					multiple
					value={groupBy.expandedGroups ?? []}
					onValueChange={groupBy.onExpandedChange}
				>
					{groupedData.map((group: GroupedDataItem<TData>) => {
						// Build pagination context for this group using shared utility
						const paginationContext = buildPaginationContext(
							contextPagination,
							group.key,
						);

						return (
							<GroupSection
								key={group.key}
								group={group}
								groupByPropertyDef={groupByProperty}
								isLoading={false}
								showAggregation={groupBy?.showAggregation ?? true}
								renderFooter={renderPagination(pagination, paginationContext)}
							>
								<ListRow
									data={group.items}
									displayProperties={displayProperties}
									showDividers={showDividers}
									onItemClick={onItemClick}
								/>
							</GroupSection>
						);
					})}
				</Accordion>
			</div>
		);
	}

	// Empty state for non-grouped view
	if (Array.isArray(data) && data.length === 0) {
		return (
			<div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
				<p>No data to display</p>
			</div>
		);
	}

	// Build pagination context for flat view
	const flatPaginationContext = buildPaginationContext(
		contextPagination,
		"$all",
	);

	// STANDARD VIEW: Flat list without grouping
	return (
		<div className={className}>
			<ListRow
				data={transformedFlatData}
				displayProperties={displayProperties}
				showDividers={showDividers}
				onItemClick={onItemClick}
			/>
			{renderPagination(pagination, flatPaginationContext)}
		</div>
	);
}

export {
	DataViewOptions,
	type DataViewOptionsProps,
} from "@ocean-dataview/dataview/components/ui/tool-bar/data-view-options";
// Re-export from shared with view-specific aliases
export type { DataViewContextValue as ListContextValue } from "../../../lib/providers/data-view-context";
export { useDataViewContext as useListContext } from "../../../lib/providers/data-view-context";
export type { DataViewProviderProps as ListProviderProps } from "../../../lib/providers/data-view-provider";
export { DataViewProvider as ListProvider } from "../../../lib/providers/data-view-provider";
// Skeleton
export { ListSkeleton } from "./list-skeleton";
