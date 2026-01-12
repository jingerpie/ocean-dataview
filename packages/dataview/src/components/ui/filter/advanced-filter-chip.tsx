"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import { useAdvanceFilterBuilder } from "@ocean-dataview/dataview/hooks";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { CompoundFilter, Filter } from "@ocean-dataview/shared/types";
import { ChevronDownIcon, ListFilterIcon } from "lucide-react";
import { FilterBuilder } from "./filter-builder";

interface AdvancedFilterChipProps<T> {
	/** The compound filter */
	filter: CompoundFilter;
	/** Available properties */
	properties: DataViewProperty<T>[];
	/** Callback when filter changes */
	onFilterChange: (filter: Filter | null) => void;
	/** Total number of rules in the filter */
	ruleCount: number;
}

/**
 * Advanced filter chip that opens the full filter builder.
 * Appearance: [≡ N rules ▾]
 *
 * Uses global Zustand store for popover state coordination with toolbar buttons.
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
		<Popover open={isOpen} onOpenChange={setOpen}>
			<PopoverTrigger render={<Button variant="secondary" size="sm" />}>
				<ListFilterIcon className="size-3" />
				<span>{ruleText}</span>
				<ChevronDownIcon className="size-3 opacity-50" />
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto min-w-80 p-3">
				<FilterBuilder
					properties={properties}
					filter={filter}
					onChange={onFilterChange}
					onDelete={() => setOpen(false)}
				/>
			</PopoverContent>
		</Popover>
	);
}

export type { AdvancedFilterChipProps };
