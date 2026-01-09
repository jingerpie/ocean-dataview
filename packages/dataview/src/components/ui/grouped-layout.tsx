"use client";

import type {
	DataViewProperty,
	PaginationContext,
} from "@ocean-dataview/dataview/types";
import type { GroupedDataItem } from "../../hooks";
import { Accordion } from "./accordion";
import { GroupSection } from "./group-section";
import { type PaginationMode, renderPagination } from "./paginations";

interface GroupedLayoutProps<TData> {
	/** Grouped data items to render */
	groups: GroupedDataItem<TData>[];

	/** Property definition for the groupBy field */
	groupByProperty: DataViewProperty<TData> | undefined;

	/** Default expanded accordion values */
	defaultExpanded?: string[];

	/** Callback when accordion value changes */
	onAccordionChange?: (value: string[]) => void;

	/** Render function for group content */
	renderGroupContent: (group: GroupedDataItem<TData>) => React.ReactNode;

	/** Pagination mode */
	pagination?: PaginationMode;

	/** Function to get pagination context for a group */
	getPaginationContext?: (groupKey: string) => PaginationContext | undefined;

	/** Optional className for the container */
	className?: string;

	/** Display aggregation counts in group headers (default: true) */
	showAggregation?: boolean;
}

/**
 * Shared component for rendering grouped data with accordion layout
 * Eliminates duplication across TableView, ListView, BoardView, GalleryView
 */
export function GroupedLayout<TData>({
	groups,
	groupByProperty,
	defaultExpanded,
	onAccordionChange,
	renderGroupContent,
	pagination,
	getPaginationContext,
	className,
	showAggregation = true,
}: GroupedLayoutProps<TData>) {
	return (
		<div className={className}>
			<Accordion
				multiple
				defaultValue={defaultExpanded}
				onValueChange={onAccordionChange}
			>
				{groups.map((group) => {
					const paginationContext = getPaginationContext?.(group.key);

					return (
						<GroupSection
							key={group.key}
							group={group}
							groupByPropertyDef={groupByProperty}
							isLoading={false}
							showAggregation={showAggregation}
							renderFooter={renderPagination(pagination, paginationContext)}
						>
							{renderGroupContent(group)}
						</GroupSection>
					);
				})}
			</Accordion>
		</div>
	);
}
