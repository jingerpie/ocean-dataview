"use client";

import {
	GroupAccordionContent,
	GroupAccordionItem,
	GroupAccordionTrigger,
} from "@ocean-dataview/ui/components/data-views/shared/group-accordion";
import { PropertyDisplay } from "@ocean-dataview/ui/lib/data-views/properties";
import type { DataViewProperty } from "@ocean-dataview/ui/lib/data-views/types";
import { Loader2 } from "lucide-react";
import type * as React from "react";

interface GroupSectionProps<TData> {
	/**
	 * Group data with items
	 */
	group: {
		key: string;
		items: TData[];
		count: number;
		displayCount?: string; // "99+" or actual count as string
		sortValue?: string | number;
	};

	/**
	 * GroupBy property definition for styling the group header
	 */
	groupByPropertyDef?: DataViewProperty<TData>;

	/**
	 * Render function for the group content
	 * Receives the group items and should return the view-specific rendering
	 */
	children: React.ReactNode;

	/**
	 * Optional footer to render at the bottom of the group (e.g., LoadMore button)
	 */
	renderFooter?: React.ReactNode;

	/**
	 * Show loading spinner in the group content area
	 */
	isLoading?: boolean;

	/**
	 * Display aggregation counts in group headers (default: true)
	 */
	showAggregation?: boolean;
}

/**
 * GroupSection - Reusable group component for all view types
 * Renders a collapsible group header with the group content
 * Uses PropertyDisplay for consistent styling across all property types
 */
export function GroupSection<TData>({
	group,
	groupByPropertyDef,
	children,
	renderFooter,
	isLoading = false,
	showAggregation = true,
}: GroupSectionProps<TData>) {
	return (
		<GroupAccordionItem value={group.key}>
			<GroupAccordionTrigger className="py-3 hover:no-underline">
				<div className="flex items-center gap-2">
					{groupByPropertyDef ? (
						<PropertyDisplay
							value={group.key}
							property={groupByPropertyDef}
							item={
								group.items[0] ??
								({ [groupByPropertyDef.id]: group.key } as TData)
							}
						/>
					) : (
						<span className="font-medium text-sm">{group.key}</span>
					)}
					{showAggregation && (
						<span className="font-medium text-muted-foreground text-xs">
							{group.displayCount ?? group.count}
						</span>
					)}
				</div>
			</GroupAccordionTrigger>
			<GroupAccordionContent>
				{isLoading && group.items.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : (
					<>
						{children}
						{renderFooter}
					</>
				)}
			</GroupAccordionContent>
		</GroupAccordionItem>
	);
}
