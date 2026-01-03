"use client";

import { GroupSection } from "@ocean-dataview/ui/components/data-views/shared";
import { GroupAccordion } from "@ocean-dataview/ui/components/data-views/shared/group-accordion";
import type {
	GroupedDataItem,
	GroupInfo,
} from "@ocean-dataview/ui/lib/data-views/hooks";
import {
	useDisplayProperties,
	useGroupConfig,
} from "@ocean-dataview/ui/lib/data-views/hooks";
import type {
	DataViewProperty,
	PaginationContext,
} from "@ocean-dataview/ui/lib/data-views/types";
import {
	buildPaginationContext,
	transformData,
	validatePropertyKeys,
} from "@ocean-dataview/ui/lib/data-views/utils";
import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useDataViewContext } from "../shared/data-view-context";
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
	 * Pagination render function
	 * Receives normalized context that works with both LoadMorePagination and PagePagination
	 * For grouped lists: renders inside each group
	 * For flat lists: renders outside list
	 */
	pagination?: (context: PaginationContext) => React.ReactNode;

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
	const { data, properties, setExcludedPropertyIds, setPropertyVisibility } =
		useDataViewContext<TData, TProperties>();

	const { showDividers = true } = layout;
	const { propertyVisibility: viewPropertyVisibility, group: groupBy } = view;

	// Sync view.propertyVisibility to context state ONLY on mount (initial state)
	const hasInitialized = useRef(false);
	useEffect(() => {
		if (!hasInitialized.current && viewPropertyVisibility) {
			setPropertyVisibility(viewPropertyVisibility);
			hasInitialized.current = true;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [viewPropertyVisibility, setPropertyVisibility]);

	// Always use context state (which can be controlled by DataViewOptions)
	const { propertyVisibility, pagination: contextPagination } =
		useDataViewContext<TData, TProperties>();

	// Update excluded properties when groupBy changes
	useEffect(() => {
		if (groupBy?.groupBy) {
			setExcludedPropertyIds([groupBy.groupBy]);
		} else {
			setExcludedPropertyIds([]);
		}
	}, [groupBy?.groupBy, setExcludedPropertyIds]);

	// Validate property keys
	const propertyValidationError = useMemo(
		() => validatePropertyKeys(properties),
		[properties],
	);

	// Transform data FIRST before grouping (so grouping only works with property IDs)
	const transformedData = useMemo(() => {
		return transformData(data as TData[], properties) as TData[];
	}, [data, properties]);

	// Check if we're using grouped pagination from context
	const hasGroupedPagination =
		contextPagination && "groups" in contextPagination;

	// Prepare group configuration (only needed for client-side grouping)
	const groupConfig = useMemo(() => {
		if (!groupBy || hasGroupedPagination) return undefined;
		return {
			groupBy: String(groupBy.groupBy),
			showAs: groupBy.showAs,
			startWeekOn: groupBy.startWeekOn,
			sort: groupBy.sort,
			hideEmptyGroups: groupBy.hideEmptyGroups,
		};
	}, [groupBy, hasGroupedPagination]);

	// Use shared hook for group configuration and processing (client-side grouping)
	// Skip if using grouped pagination from context
	const {
		groupedData: clientGroupedData,
		validationError,
		groupByProperty: clientGroupByProperty,
	} = useGroupConfig(transformedData, properties, groupConfig);

	// Get groupBy property for header display
	const groupByProperty = useMemo(() => {
		if (hasGroupedPagination && groupBy?.groupBy) {
			// Server pagination - find property manually
			return properties.find((p) => String(p.id) === groupBy.groupBy);
		}
		// Client grouping - use from hook
		return clientGroupByProperty;
	}, [hasGroupedPagination, groupBy, properties, clientGroupByProperty]);

	// Choose grouped data source: pagination.groups (server) or useGroupConfig (client)
	const groupedData = useMemo(() => {
		if (hasGroupedPagination && "groups" in contextPagination) {
			// Convert pagination.groups to GroupedDataItem format
			return contextPagination.groups.map((group: GroupInfo<TData>) => ({
				key: group.key,
				items: transformData(group.items, properties) as TData[],
				count: group.count,
				displayCount: group.displayCount,
				sortValue: group.value,
			}));
		}
		return clientGroupedData;
	}, [hasGroupedPagination, contextPagination, clientGroupedData, properties]);

	// Use shared hook for display properties filtering
	const displayProperties = useDisplayProperties(
		properties,
		propertyVisibility,
		groupConfig ? [groupConfig.groupBy] : undefined,
	);

	// Transform flat data for non-grouped view (must be before early returns)
	const transformedFlatData = useMemo(
		() => transformData(data as TData[], properties) as TData[],
		[data, properties],
	);

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
				<GroupAccordion
					type="multiple"
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
								renderFooter={
									pagination && paginationContext
										? pagination(paginationContext)
										: undefined
								}
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
				</GroupAccordion>
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

	// STANDARD VIEW: Flat list without grouping
	return (
		<ListRow
			data={transformedFlatData}
			displayProperties={displayProperties}
			showDividers={showDividers}
			onItemClick={onItemClick}
			className={className}
		/>
	);
}

export {
	DataViewOptions,
	type DataViewOptionsProps,
} from "@ocean-dataview/ui/components/data-views/shared/data-view-options";
// Re-export from shared with view-specific aliases
export type { DataViewContextValue as ListContextValue } from "../shared/data-view-context";
export { useDataViewContext as useListContext } from "../shared/data-view-context";
export type { DataViewProviderProps as ListProviderProps } from "../shared/data-view-provider";
export { DataViewProvider as ListProvider } from "../shared/data-view-provider";
