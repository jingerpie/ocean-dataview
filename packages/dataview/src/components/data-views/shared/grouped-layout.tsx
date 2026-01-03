"use client";

import type { GroupedDataItem } from "@ocean-dataview/dataview/lib/data-views/hooks/use-group-config";
import type {
	DataViewProperty,
	PaginationContext,
} from "@ocean-dataview/dataview/lib/data-views/types";
import { GroupAccordion } from "./group-accordion";
import { GroupSection } from "./group-section";

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

	/** Optional pagination render function */
	pagination?: (context: PaginationContext) => React.ReactNode;

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
	className,
	showAggregation = true,
}: GroupedLayoutProps<TData>) {
	return (
		<div className={className}>
			<GroupAccordion
				type="multiple"
				defaultValue={defaultExpanded}
				onValueChange={onAccordionChange}
			>
				{groups.map((group) => {
					return (
						<GroupSection
							key={group.key}
							group={group}
							groupByPropertyDef={groupByProperty}
							isLoading={false}
							showAggregation={showAggregation}
							renderFooter={
								pagination ? pagination({} as PaginationContext) : undefined
							}
						>
							{renderGroupContent(group)}
						</GroupSection>
					);
				})}
			</GroupAccordion>
		</div>
	);
}
