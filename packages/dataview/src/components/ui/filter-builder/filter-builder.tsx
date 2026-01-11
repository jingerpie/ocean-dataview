"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { CompoundFilter, Filter } from "@ocean-dataview/shared/types";
import {
	createDefaultCondition,
	normalizeFilter,
} from "@ocean-dataview/shared/utils";
import { TrashIcon } from "lucide-react";
import { Button } from "../button";
import { AddFilterButton } from "./add-filter-button";
import { FilterGroup } from "./filter-group";

interface FilterBuilderProps<T> {
	/** Available properties to filter on */
	properties: DataViewProperty<T>[];
	/** Current filter (null if no filter) */
	filter: Filter | null;
	/** Callback when filter changes */
	onChange: (filter: Filter | null) => void;
	/** Additional class names */
	className?: string;
}

/**
 * Root filter builder component.
 * Provides the Notion-style advanced filter UI with recursive AND/OR groups.
 */
export function FilterBuilder<T>({
	properties,
	filter,
	onChange,
	className,
}: FilterBuilderProps<T>) {
	// Normalize filter to always work with compound filters internally
	const normalizedFilter = normalizeFilter(filter);

	// Handle adding the first rule
	const handleAddFirstRule = (
		condition: ReturnType<typeof createDefaultCondition>,
	) => {
		onChange({ and: [condition] });
	};

	// Handle adding the first group
	const handleAddFirstGroup = () => {
		const defaultProperty = properties[0]?.id ? String(properties[0].id) : "";
		const defaultCondition = createDefaultCondition(defaultProperty);
		onChange({ and: [{ and: [defaultCondition] }] });
	};

	// Handle filter changes from FilterGroup
	const handleFilterChange = (newFilter: CompoundFilter) => {
		onChange(newFilter);
	};

	// Handle deleting all filters
	const handleDeleteFilter = () => {
		onChange(null);
	};

	// Empty state - show only add button
	if (!normalizedFilter) {
		return (
			<div className={cn("py-2", className)}>
				<AddFilterButton
					properties={properties}
					canAddGroup={true}
					onAddRule={handleAddFirstRule}
					onAddGroup={handleAddFirstGroup}
				/>
			</div>
		);
	}

	return (
		<div className={cn("space-y-3", className)}>
			{/* Filter Group */}
			<FilterGroup
				filter={normalizedFilter}
				properties={properties}
				level={0}
				isFirst={true}
				onChange={handleFilterChange}
				onRemove={handleDeleteFilter}
			/>

			{/* Delete Filter Button */}
			<div className="border-t pt-3">
				<Button
					variant="ghost"
					size="sm"
					className="h-7 gap-1.5 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
					onClick={handleDeleteFilter}
				>
					<TrashIcon className="size-3.5" />
					<span>Delete filter</span>
				</Button>
			</div>
		</div>
	);
}

export type { FilterBuilderProps };
