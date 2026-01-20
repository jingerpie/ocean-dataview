"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@ocean-dataview/dataview/components/ui/dropdown-menu";
import { useAdvanceFilterBuilder } from "@ocean-dataview/dataview/hooks";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { WhereExpression, WhereNode } from "@ocean-dataview/shared/types";
import { ChevronDownIcon, ListFilterIcon } from "lucide-react";
import { FilterBuilder } from "./filter-builder";

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

	return (
		<DropdownMenu onOpenChange={setOpen} open={isOpen}>
			<DropdownMenuTrigger render={<Button size="sm" variant="secondary" />}>
				<ListFilterIcon className="size-3" />
				<span>{ruleText}</span>
				<ChevronDownIcon className="size-3" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-auto min-w-64">
				<FilterBuilder
					filter={filter}
					onChange={onFilterChange}
					onDelete={() => setOpen(false)}
					properties={properties}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export type { AdvancedFilterChipProps };
