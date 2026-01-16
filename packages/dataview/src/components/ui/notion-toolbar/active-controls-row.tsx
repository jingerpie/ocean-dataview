"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type {
	CompoundFilter,
	Filter,
	FilterCondition,
	PropertySort,
} from "@ocean-dataview/shared/types";
import {
	createDefaultCondition,
	getDefaultFilterOperator,
	getFilterVariantFromPropertyType,
	normalizeFilter,
	removeItem,
	updateCondition,
} from "@ocean-dataview/shared/utils";
import { useState } from "react";
import {
	AdvancedFilterChip,
	FilterChip,
	FilterPropertyPicker,
} from "../filter";
import { SortChip } from "../sort";

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
	/** Advanced filter (CompoundFilter at root level) */
	advancedFilter: CompoundFilter | null;
	/** Index of advancedFilter in root array */
	advancedFilterIndex: number | null;
	/** Simple filter conditions (FilterConditions at root level) */
	simpleFilterConditions: Array<{ condition: FilterCondition; index: number }>;
	/** Total rule count in advanced filter */
	ruleCount: number;
	/** Callback to open advanced filter builder */
	onOpenAdvancedFilter: () => void;
	/** Additional class names */
	className?: string;
}

/**
 * Row 2 of the NotionToolbar showing active sort/filter chips.
 *
 * Display Order (Fixed):
 * 1. Sort chips
 * 2. Advanced filter chip (if exists)
 * 3. Simple filter chips (in array order)
 * 4. "+ Filter" button
 */
export function ActiveControlsRow<T>({
	sorts,
	onSortsChange,
	filter,
	onFilterChange,
	properties,
	advancedFilter,
	advancedFilterIndex,
	simpleFilterConditions,
	ruleCount,
	onOpenAdvancedFilter,
	className,
}: ActiveControlsRowProps<T>) {
	const [addFilterOpen, setAddFilterOpen] = useState(false);

	// Get normalized filter for operations
	const normalizedFilter = normalizeFilter(filter);

	// Get property IDs already used in simple filters (to hide from picker)
	const usedPropertyIds = simpleFilterConditions.map(
		(f) => f.condition.property
	);

	// Handle adding a new simple filter (adds FilterCondition to root)
	const handleAddFilter = (property: DataViewProperty<T>) => {
		// Get the correct default operator based on property type
		const filterVariant = getFilterVariantFromPropertyType(property.type);
		const defaultOperator = getDefaultFilterOperator(filterVariant);
		const condition = createDefaultCondition(
			String(property.id),
			defaultOperator
		);

		if (normalizedFilter) {
			// Add to root level (alongside any existing advanced filter)
			const items = normalizedFilter.and ?? [];
			onFilterChange({ and: [...items, condition] });
		} else {
			// Create new filter with AND logic
			onFilterChange({ and: [condition] });
		}
		setAddFilterOpen(false);
	};

	// Handle updating a simple filter condition
	const handleConditionChange = (
		index: number,
		newCondition: FilterCondition
	) => {
		if (!normalizedFilter) {
			return;
		}
		onFilterChange(updateCondition(normalizedFilter, [index], newCondition));
	};

	// Handle removing a simple filter condition
	const handleConditionRemove = (index: number) => {
		if (!normalizedFilter) {
			return;
		}
		const result = removeItem(normalizedFilter, [index]);
		onFilterChange(result);
	};

	// Handle adding a simple condition to advanced filter
	const handleAddToAdvanced = (index: number, condition: FilterCondition) => {
		if (!normalizedFilter) {
			return;
		}

		const items = [...(normalizedFilter.and ?? [])];

		// Remove the condition from root level
		items.splice(index, 1);

		if (advancedFilter && advancedFilterIndex !== null) {
			// Add to existing advanced filter
			const advancedItems = advancedFilter.and ?? advancedFilter.or ?? [];
			const newAdvanced = advancedFilter.and
				? { and: [...advancedItems, condition] }
				: { or: [...advancedItems, condition] };
			items[advancedFilterIndex] = newAdvanced;
		} else {
			// Create new advanced filter with wrapped structure
			const newAdvanced = { and: [condition] };
			items.unshift(newAdvanced); // Add at beginning
		}

		onFilterChange(items.length > 0 ? { and: items } : null);
	};

	// Handle advanced filter changes
	const handleAdvancedFilterChange = (newAdvanced: Filter | null) => {
		if (!normalizedFilter || advancedFilterIndex === null) {
			// No existing filter or advanced filter - set as new root
			if (newAdvanced) {
				onFilterChange({ and: [newAdvanced] });
			} else {
				onFilterChange(null);
			}
			return;
		}

		const items = [...(normalizedFilter.and ?? [])];

		if (newAdvanced === null) {
			// Remove advanced filter
			items.splice(advancedFilterIndex, 1);
			if (items.length === 0) {
				onFilterChange(null);
			} else {
				onFilterChange({ and: items });
			}
		} else {
			// Update advanced filter at its index
			items[advancedFilterIndex] = newAdvanced;
			onFilterChange({ and: items });
		}
	};

	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-1.5",
				"fade-in slide-in-from-top-1 animate-in duration-150",
				className
			)}
		>
			{/* 1. Sort Chips */}
			{sorts.map((sort, index) => (
				<SortChip
					key={`sort-${String(sort.propertyId)}-${index}`}
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
					properties={properties}
					sort={sort}
				/>
			))}

			{/* 2. Advanced Filter Chip (if exists) */}
			{advancedFilter && (
				<AdvancedFilterChip
					filter={advancedFilter}
					onFilterChange={handleAdvancedFilterChange}
					properties={properties}
					ruleCount={ruleCount}
				/>
			)}

			{/* 3. Simple Filter Chips (in array order) */}
			{simpleFilterConditions.map(({ condition, index }) => {
				const property = properties.find(
					(p) => String(p.id) === condition.property
				);
				if (!property) {
					return null;
				}

				return (
					<FilterChip
						condition={condition}
						key={`filter-${condition.property}-${index}`}
						onAddToAdvanced={() => handleAddToAdvanced(index, condition)}
						onConditionChange={(newCondition) =>
							handleConditionChange(index, newCondition)
						}
						onRemove={() => handleConditionRemove(index)}
						property={property}
					/>
				);
			})}

			{/* 4. + Filter Button */}
			<FilterPropertyPicker
				excludePropertyIds={usedPropertyIds}
				onAdvancedFilter={onOpenAdvancedFilter}
				onOpenChange={setAddFilterOpen}
				onSelect={handleAddFilter}
				open={addFilterOpen}
				properties={properties}
				variant="add"
			/>
		</div>
	);
}

export type { ActiveControlsRowProps };
