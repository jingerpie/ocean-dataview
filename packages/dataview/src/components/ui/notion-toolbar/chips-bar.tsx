"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type {
	PropertySort,
	WhereExpression,
	WhereNode,
	WhereRule,
} from "@ocean-dataview/shared/types";
import {
	normalizeFilter,
	removeItem,
	updateCondition,
} from "@ocean-dataview/shared/utils";
import {
	AdvancedFilterChip,
	FilterChip,
	FilterPropertyPicker,
} from "../filter";
import { SortChip } from "../sort";

interface ChipsBarProps<T> {
	/** Current sorts (multiple sorts supported) */
	sorts: PropertySort<T>[];
	/** Callback when sorts change */
	onSortsChange: (sorts: PropertySort<T>[]) => void;
	/** Current filter */
	filter: WhereNode | null;
	/** Callback when filter changes */
	onFilterChange: (filter: WhereNode | null) => void;
	/** Available properties */
	properties: DataViewProperty<T>[];
	/** Advanced filter (WhereExpression at root level) */
	advancedFilter: WhereExpression | null;
	/** Index of advancedFilter in root array */
	advancedFilterIndex: number | null;
	/** Simple filter rules (WhereRules at root level) */
	simpleFilterConditions: Array<{ condition: WhereRule; index: number }>;
	/** Total rule count in advanced filter */
	ruleCount: number;
	/** Additional class names */
	className?: string;
}

/**
 * Bar displaying active sort/filter chips.
 *
 * Display Order (Fixed):
 * 1. Sort list (multi-sort with drag-and-drop)
 * 2. Advanced filter chip (if exists)
 * 3. Simple filter chips (in array order)
 * 4. "+ Filter" button
 */
export function ChipsBar<T>({
	sorts,
	onSortsChange,
	filter,
	onFilterChange,
	properties,
	advancedFilter,
	advancedFilterIndex,
	simpleFilterConditions,
	ruleCount,
	className,
}: ChipsBarProps<T>) {
	// Get normalized filter for operations
	const normalizedFilter = normalizeFilter(filter);

	// Handle updating a simple filter rule
	const handleRuleChange = (index: number, newRule: WhereRule) => {
		if (!normalizedFilter) {
			return;
		}
		onFilterChange(updateCondition(normalizedFilter, [index], newRule));
	};

	// Handle removing a simple filter rule
	const handleRuleRemove = (index: number) => {
		if (!normalizedFilter) {
			return;
		}
		const result = removeItem(normalizedFilter, [index]);
		// Clean up empty filter - if no items left, set to null
		const cleanResult = result.and?.length === 0 ? null : result;
		onFilterChange(cleanResult);
	};

	// Handle adding a simple rule to advanced filter
	const handleAddToAdvanced = (index: number, rule: WhereRule) => {
		if (!normalizedFilter) {
			return;
		}

		const items = [...(normalizedFilter.and ?? [])];

		// Remove the rule from root level
		items.splice(index, 1);

		if (advancedFilter && advancedFilterIndex !== null) {
			// Add to existing advanced filter
			const advancedItems = advancedFilter.and ?? advancedFilter.or ?? [];
			const newAdvanced = advancedFilter.and
				? { and: [...advancedItems, rule] }
				: { or: [...advancedItems, rule] };
			items[advancedFilterIndex] = newAdvanced;
		} else {
			// Create new advanced filter with wrapped structure
			const newAdvanced = { and: [rule] };
			items.unshift(newAdvanced); // Add at beginning
		}

		onFilterChange(items.length > 0 ? { and: items } : null);
	};

	// Handle advanced filter changes
	const handleAdvancedFilterChange = (newAdvanced: WhereNode | null) => {
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
				"flex items-center gap-1.5 overflow-x-auto",
				"fade-in slide-in-from-top-1 animate-in duration-150",
				className
			)}
		>
			{/* 1. Sort Chip (multi-sort with drag-and-drop) */}
			{sorts.length > 0 && (
				<SortChip
					onSortsChange={onSortsChange}
					properties={properties}
					sorts={sorts}
				/>
			)}

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
						key={`filter-${condition.property}-${index}`}
						onAddToAdvanced={() => handleAddToAdvanced(index, condition)}
						onRemove={() => handleRuleRemove(index)}
						onRuleChange={(newRule) => handleRuleChange(index, newRule)}
						property={property}
						rule={condition}
						variant="detailed"
					/>
				);
			})}

			{/* 4. + Filter Button */}
			<FilterPropertyPicker properties={properties} variant="inline" />

			{/* 5. Clear All Button - Sticky to right */}
			<Button
				className="sticky right-0 ml-auto shrink-0 bg-background text-muted-foreground hover:text-foreground"
				onClick={() => {
					onFilterChange(null);
					onSortsChange([]);
				}}
				size="sm"
				variant="ghost"
			>
				Reset
			</Button>
		</div>
	);
}

export type { ChipsBarProps };
