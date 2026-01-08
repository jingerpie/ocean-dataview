"use client";

import { GroupSection } from "@ocean-dataview/dataview/components/data-views/shared";
import { GroupAccordion } from "@ocean-dataview/dataview/components/data-views/shared/group-accordion";
import {
	type PaginationMode,
	renderPagination,
} from "@ocean-dataview/dataview/components/data-views/shared/pagination-renderer";
import type {
	GroupedDataItem,
	GroupInfiniteInfo,
	GroupInfo,
} from "@ocean-dataview/dataview/lib/data-views/hooks";
import {
	useDisplayProperties,
	useGroupConfig,
} from "@ocean-dataview/dataview/lib/data-views/hooks";
import type { DataViewProperty } from "@ocean-dataview/dataview/lib/data-views/types";
import {
	buildPaginationContext,
	transformData,
	validatePropertyKeys,
} from "@ocean-dataview/dataview/lib/data-views/utils";
import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useDataViewContext } from "../shared/data-view-context";
import { GalleryCard } from "./gallery-card";

export interface GalleryViewProps<
	TData,
	TProperties extends
		readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
> {
	/**
	 * Layout configuration
	 */
	layout: {
		/** Property ID for card preview image (references property.id, not data key) */
		cardPreview?: TProperties[number]["id"];
		cardSize?: "small" | "medium" | "large";
		fitImage?: boolean;
		wrapAllProperties?: boolean;
		showPropertyNames?: boolean;
	};

	/**
	 * View configuration
	 */
	view?: {
		propertyVisibility?: TProperties[number]["id"][];

		/**
		 * Group By configuration - creates collapsible groups in gallery
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
	 * Card click handler
	 */
	onCardClick?: (item: TData) => void;

	/**
	 * Pagination mode for the gallery.
	 * - "page": Classic prev/next pagination with "Showing X-Y"
	 * - "loadMore": "Load more" button
	 * - "infiniteScroll": Auto-load on scroll
	 * - undefined: No pagination UI
	 *
	 * For grouped galleries: renders inside each group
	 * For flat galleries: renders below the gallery
	 */
	pagination?: PaginationMode;

	/**
	 * Additional className
	 */
	className?: string;
}

/**
 * GalleryView with property-based display
 * Displays data as cards in a responsive grid with images
 */
export function GalleryView<
	TData,
	TProperties extends
		readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({
	layout = {},
	view = {},
	onCardClick,
	pagination,
	className,
}: GalleryViewProps<TData, TProperties>) {
	// Get data and properties from context
	const { data, properties, setExcludedPropertyIds, setPropertyVisibility } =
		useDataViewContext<TData, TProperties>();

	const {
		cardPreview,
		cardSize = "medium",
		fitImage = true,
		wrapAllProperties = false,
		showPropertyNames = false,
	} = layout;
	const { propertyVisibility: viewPropertyVisibility, group: groupBy } = view;

	// Sync view.propertyVisibility to context state ONLY on mount (initial state)
	const hasInitialized = useRef(false);
	useEffect(() => {
		if (!hasInitialized.current && viewPropertyVisibility) {
			setPropertyVisibility(viewPropertyVisibility);
			hasInitialized.current = true;
		}
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
			// Groups can be either GroupInfo (page) or GroupInfiniteInfo (infinite)
			return contextPagination.groups.map(
				(group: GroupInfo<TData> | GroupInfiniteInfo<TData>) => ({
					key: group.key,
					items: transformData(group.items, properties) as TData[],
					count: group.count,
					displayCount: group.displayCount,
					sortValue: group.value,
				}),
			);
		}
		return clientGroupedData;
	}, [hasGroupedPagination, contextPagination, clientGroupedData, properties]);

	// Use shared hook for display properties filtering (exclude preview and groupBy)
	const excludeKeys = [
		cardPreview,
		...(groupConfig ? [groupConfig.groupBy] : []),
	].filter((key): key is string => key !== undefined);
	const displayProperties = useDisplayProperties(
		properties,
		propertyVisibility,
		excludeKeys,
	);

	// Get card dimensions based on size
	const getCardDimensions = () => {
		switch (cardSize) {
			case "small":
				return {
					width: 200,
					imageHeight: 150,
					cols: "grid-cols-1 sm:grid-cols-3 lg:grid-cols-5",
				};
			case "large":
				return {
					width: 360,
					imageHeight: 260,
					cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
				};
			default: // medium
				return {
					width: 280,
					imageHeight: 200,
					cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
				};
		}
	};

	const { imageHeight, cols } = getCardDimensions();

	// Transform flat data (for non-grouped view) - must be before early returns
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
					Invalid gallery configuration
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
								renderFooter={renderPagination(pagination, paginationContext)}
							>
								<GalleryCard
									data={group.items}
									displayProperties={displayProperties}
									cardPreview={cardPreview}
									imageHeight={imageHeight}
									cols={cols}
									fitImage={fitImage}
									wrapAllProperties={wrapAllProperties}
									showPropertyNames={showPropertyNames}
									onCardClick={onCardClick}
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

	// Build pagination context for flat view
	const flatPaginationContext = buildPaginationContext(
		contextPagination,
		"$all",
	);

	// STANDARD VIEW: Flat gallery without grouping
	return (
		<div className={className}>
			<GalleryCard
				data={transformedFlatData}
				displayProperties={displayProperties}
				cardPreview={cardPreview}
				imageHeight={imageHeight}
				cols={cols}
				fitImage={fitImage}
				wrapAllProperties={wrapAllProperties}
				showPropertyNames={showPropertyNames}
				onCardClick={onCardClick}
			/>
			{renderPagination(pagination, flatPaginationContext)}
		</div>
	);
}

export {
	DataViewOptions,
	type DataViewOptionsProps,
} from "@ocean-dataview/dataview/components/data-views/shared/data-view-options";
// Re-export from shared with view-specific aliases
export type { DataViewContextValue as GalleryContextValue } from "../shared/data-view-context";
export { useDataViewContext as useGalleryContext } from "../shared/data-view-context";
export type { DataViewProviderProps as GalleryProviderProps } from "../shared/data-view-provider";
export { DataViewProvider as GalleryProvider } from "../shared/data-view-provider";
// Skeleton
export { GallerySkeleton } from "./gallery-skeleton";
