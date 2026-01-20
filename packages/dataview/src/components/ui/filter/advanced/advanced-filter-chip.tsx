"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ocean-dataview/dataview/components/ui/dropdown-menu";
import { useAdvanceFilterBuilder } from "@ocean-dataview/dataview/hooks";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { WhereExpression, WhereNode } from "@ocean-dataview/shared/types";
import {
	createDefaultCondition,
	normalizeFilter,
} from "@ocean-dataview/shared/utils";
import { ChevronDownIcon, ListFilterIcon, TrashIcon } from "lucide-react";
import { Separator } from "../../separator";
import { AddFilterButton } from "./add-filter-button";
import { FilterGroup } from "./filter-group";

interface AdvancedFilterChipProps<T> {
	/** The compound filter */
	filter: WhereExpression;
	/** Available properties */
	properties: DataViewProperty<T>[];
	/** Callback when filter changes */
	onFilterChange: (filter: WhereNode | null) => void;
	/** Total number of rules in the filter */
	ruleCount: number;
}

/**
 * Advanced filter chip that opens the full filter builder.
 * Appearance: [≡ N rules ▾]
 *
 * Uses global Zustand store for dropdown state coordination with toolbar buttons.
 */
export function AdvancedFilterChip<T>({
	filter,
	properties,
	onFilterChange,
	ruleCount,
}: AdvancedFilterChipProps<T>) {
	const { isOpen, setOpen } = useAdvanceFilterBuilder();

	const ruleText = ruleCount === 1 ? "1 rule" : `${ruleCount} rules`;

	// Normalize filter to always work with compound filters internally
	const normalizedFilter = normalizeFilter(filter);

	// Handle adding the first rule
	const handleAddFirstRule = (
		condition: ReturnType<typeof createDefaultCondition>
	) => {
		onFilterChange({ and: [{ and: [condition] }] });
	};

	// Handle adding the first group
	const handleAddFirstGroup = () => {
		const defaultProperty = properties[0]?.id ? String(properties[0].id) : "";
		const defaultCondition = createDefaultCondition(defaultProperty);
		onFilterChange({ and: [{ and: [defaultCondition] }] });
	};

	// Handle filter changes from FilterGroup
	const handleFilterChange = (newFilter: WhereExpression) => {
		onFilterChange(newFilter);
	};

	// Handle deleting all filters
	const handleDeleteFilter = () => {
		onFilterChange(null);
		setOpen(false);
	};

	return (
		<DropdownMenu onOpenChange={setOpen} open={isOpen}>
			<DropdownMenuTrigger render={<Button size="sm" variant="secondary" />}>
				<ListFilterIcon className="size-3" />
				<span>{ruleText}</span>
				<ChevronDownIcon className="size-3" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-auto min-w-64">
				<div className="flex flex-col gap-1">
					{/* Filter Content */}
					{normalizedFilter ? (
						<FilterGroup
							filter={normalizedFilter}
							isFirst={true}
							level={0}
							onChange={handleFilterChange}
							onRemove={handleDeleteFilter}
							properties={properties}
						/>
					) : (
						<AddFilterButton
							canAddGroup={true}
							onAddGroup={handleAddFirstGroup}
							onAddRule={handleAddFirstRule}
							properties={properties}
						/>
					)}

					<Separator />

					{/* Delete Filter */}
					<DropdownMenuItem onClick={handleDeleteFilter} variant="destructive">
						<TrashIcon />
						Delete filter
					</DropdownMenuItem>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export type { AdvancedFilterChipProps };
