"use client";

import { Badge } from "@ocean-dataview/ui/components/badge";
import { GroupSection } from "@ocean-dataview/ui/components/data-views/shared";
import { GroupAccordion } from "@ocean-dataview/ui/components/data-views/shared/group-accordion";
import type { DataViewProperty } from "@ocean-dataview/ui/lib/data-views/types";
import { cn } from "@ocean-dataview/ui/lib/utils";
import type { ReactNode } from "react";

interface BoardColumnProps<TData> {
	groupName: string;
	items: TData[];
	cardContent: (item: TData, index: number) => ReactNode;
	keyExtractor: (item: TData, index: number) => string;
	columnHeader?: (groupName: string, count: number) => ReactNode;
	columnBgClass?: string;
	columnWidth?: string;

	// Sub-grouping support
	subGroupedData?: Array<{
		key: string;
		items: TData[];
		count: number;
		sortValue: string | number;
	}>;
	subGroupByPropertyDef?: DataViewProperty<TData>;

	// Controlled accordion state (synchronized across all columns)
	expandedSubGroups?: string[];
	onExpandedSubGroupsChange?: (value: string[]) => void;

	// Footer renderer (for pagination)
	renderFooter?: () => ReactNode;
}

export function BoardColumn<TData>({
	groupName,
	items,
	cardContent,
	keyExtractor,
	columnHeader,
	columnBgClass,
	columnWidth,
	subGroupedData,
	subGroupByPropertyDef,
	expandedSubGroups,
	onExpandedSubGroupsChange,
	renderFooter,
}: BoardColumnProps<TData>) {
	// Helper function to render cards for a given set of items
	const renderCards = (cardItems: TData[]) => {
		if (cardItems.length === 0) {
			return (
				<div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
					No items
				</div>
			);
		}

		return cardItems.map((item, index) => {
			const key = keyExtractor(item, index);
			return <div key={key}>{cardContent(item, index)}</div>;
		});
	};

	return (
		<div
			className={cn(
				"flex flex-shrink-0 flex-col gap-2 rounded-lg p-2 transition-colors",
				columnWidth,
				columnBgClass || "bg-muted/10",
			)}
		>
			{/* Column Header */}
			{columnHeader ? (
				columnHeader(groupName, items.length)
			) : (
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-sm">{groupName}</h3>
					<Badge variant="secondary" className="ml-2">
						{items.length}
					</Badge>
				</div>
			)}

			{/* Cards - either sub-grouped or flat */}
			<div className="flex min-h-[200px] flex-1 flex-col gap-2 overflow-y-auto">
				{subGroupedData && subGroupedData.length > 0 ? (
					<GroupAccordion
						type="multiple"
						value={expandedSubGroups}
						onValueChange={onExpandedSubGroupsChange}
					>
						{subGroupedData.map((subGroup) => (
							<GroupSection
								key={subGroup.key}
								group={subGroup}
								groupByPropertyDef={subGroupByPropertyDef}
							>
								<div className="flex flex-col gap-2 pt-2">
									{renderCards(subGroup.items)}
								</div>
							</GroupSection>
						))}
					</GroupAccordion>
				) : (
					renderCards(items)
				)}
			</div>

			{/* Column Footer (pagination) */}
			{renderFooter?.()}
		</div>
	);
}
