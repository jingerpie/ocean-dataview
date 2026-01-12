"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { CommandItem } from "@ocean-dataview/dataview/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { PropertySort } from "@ocean-dataview/shared/types";
import {
	type Filter,
	type FilterCondition,
	isCompoundFilter,
} from "@ocean-dataview/shared/types";
import {
	addCondition,
	createDefaultCondition,
	normalizeFilter,
	removeItem,
	updateCondition,
} from "@ocean-dataview/shared/utils";
import { PlusIcon } from "lucide-react";
import * as React from "react";
import { AdvancedFilterChip, FilterChip } from "../filter";
import { SortChip } from "../sort";
import { PropertySelector } from "../toolbar";

interface ActiveControlsRowProps<T> {
	/** Current sorts (multiple sorts supported) */
	sorts: PropertySort<T>[];
	/** Callback when sorts change */
	onSortsChange: (sorts: PropertySort<T>[]) => void;
	/** Current filter */
	filter: Filter | null;
	/** Callback when filter changes */
	onFilterChange: (filter: Filter | null) => void;
	/** Available properties */
	properties: DataViewProperty<T>[];
	/** Whether this is a compound filter (nested/OR logic) */
	isFilterCompound: boolean;
	/** Simple filter conditions (top-level AND conditions) */
	simpleFilterConditions: Array<{ condition: FilterCondition; index: number }>;
	/** Total rule count */
	ruleCount: number;
	/** Callback to open advanced filter */
	onOpenAdvancedFilter: () => void;
	/** Additional class names */
	className?: string;
}

/**
 * Row 2 of the NotionToolbar showing active sort/filter chips.
 * Order: [Sort Chip] [Advanced Filter Chip] [Simple Filter Chips] [+ Filter]
 */
export function ActiveControlsRow<T>({
	sorts,
	onSortsChange,
	filter,
	onFilterChange,
	properties,
	isFilterCompound,
	simpleFilterConditions,
	ruleCount,
	onOpenAdvancedFilter,
	className,
}: ActiveControlsRowProps<T>) {
	const [addFilterOpen, setAddFilterOpen] = React.useState(false);

	// Get normalized filter for operations
	const normalizedFilter = normalizeFilter(filter);

	// Handle adding a new simple filter
	const handleAddFilter = (property: DataViewProperty<T>) => {
		const condition = createDefaultCondition(String(property.id));

		if (normalizedFilter) {
			// Add to existing filter
			onFilterChange(addCondition(normalizedFilter, [], condition));
		} else {
			// Create new filter with AND logic
			onFilterChange({ and: [condition] });
		}
		setAddFilterOpen(false);
	};

	// Handle updating a simple filter condition
	const handleConditionChange = (
		index: number,
		newCondition: FilterCondition,
	) => {
		if (!normalizedFilter) return;
		onFilterChange(updateCondition(normalizedFilter, [index], newCondition));
	};

	// Handle removing a simple filter condition
	const handleConditionRemove = (index: number) => {
		if (!normalizedFilter) return;
		const result = removeItem(normalizedFilter, [index]);
		onFilterChange(result);
	};

	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-1.5",
				"fade-in slide-in-from-top-1 animate-in duration-150",
				className,
			)}
		>
			{/* Sort Chips */}
			{sorts.map((sort, index) => (
				<SortChip
					key={`sort-${String(sort.propertyId)}-${index}`}
					sort={sort}
					properties={properties}
					onSortChange={(newSort) => {
						if (newSort === null) {
							// Remove this sort
							onSortsChange(sorts.filter((_, i) => i !== index));
						} else {
							// Update this sort
							const newSorts = [...sorts];
							newSorts[index] = newSort;
							onSortsChange(newSorts);
						}
					}}
				/>
			))}

			{/* Advanced Filter Chip - shown when filter is compound */}
			{isFilterCompound &&
				normalizedFilter &&
				isCompoundFilter(normalizedFilter) && (
					<AdvancedFilterChip
						filter={normalizedFilter}
						properties={properties}
						onFilterChange={onFilterChange}
						ruleCount={ruleCount}
					/>
				)}

			{/* Simple Filter Chips - shown when filter has simple conditions */}
			{!isFilterCompound &&
				simpleFilterConditions.map(({ condition, index }) => {
					const property = properties.find(
						(p) => String(p.id) === condition.property,
					);
					if (!property) return null;

					return (
						<FilterChip
							key={`${condition.property}-${index}`}
							condition={condition}
							property={property}
							onConditionChange={(newCondition) =>
								handleConditionChange(index, newCondition)
							}
							onRemove={() => handleConditionRemove(index)}
						/>
					);
				})}

			{/* + Filter Button */}
			<Popover open={addFilterOpen} onOpenChange={setAddFilterOpen}>
				<PopoverTrigger
					render={
						<Button
							variant="ghost"
							size="sm"
							className="h-7 gap-1 px-2 text-muted-foreground text-xs"
						/>
					}
				>
					<PlusIcon className="size-3" />
					<span>Filter</span>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-56 p-0">
					<PropertySelector
						properties={properties}
						onSelect={handleAddFilter}
						placeholder="Filter by..."
						footer={
							<CommandItem
								onSelect={() => {
									setAddFilterOpen(false);
									onOpenAdvancedFilter();
								}}
							>
								<PlusIcon className="mr-2 size-4" />
								<span>Add advanced filter</span>
							</CommandItem>
						}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}

export type { ActiveControlsRowProps };
