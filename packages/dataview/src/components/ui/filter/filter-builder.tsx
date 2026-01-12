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
import { Separator } from "../separator";
import { AddFilterButton } from "./add-filter-button";
import { FilterGroup } from "./filter-group";

interface FilterBuilderProps<T> {
	/** Available properties to filter on */
	properties: DataViewProperty<T>[];
	/** Current filter (null if no filter) */
	filter: Filter | null;
	/** Callback when filter changes */
	onChange: (filter: Filter | null) => void;
	/** Callback when delete filter button is clicked (after onChange is called) */
	onDelete?: () => void;
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
	onDelete,
	className,
}: FilterBuilderProps<T>) {
	// Normalize filter to always work with compound filters internally
	const normalizedFilter = normalizeFilter(filter);

	// Handle adding the first rule
	// Creates wrapped structure { and: [{ and: [condition] }] } for advanced filter
	const handleAddFirstRule = (
		condition: ReturnType<typeof createDefaultCondition>,
	) => {
		onChange({ and: [{ and: [condition] }] });
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
		onDelete?.();
	};

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			{/* Filter Content */}
			{normalizedFilter ? (
				<FilterGroup
					filter={normalizedFilter}
					properties={properties}
					level={0}
					isFirst={true}
					onChange={handleFilterChange}
					onRemove={handleDeleteFilter}
				/>
			) : (
				<AddFilterButton
					properties={properties}
					canAddGroup={true}
					onAddRule={handleAddFirstRule}
					onAddGroup={handleAddFirstGroup}
					className="justify-start"
				/>
			)}

			<Separator />

			{/* Delete Filter Button - Always visible */}
			<div>
				<Button
					variant="destructive"
					size="sm"
					className="w-full justify-start"
					onClick={handleDeleteFilter}
				>
					<TrashIcon />
					<span>Delete filter</span>
				</Button>
			</div>
		</div>
	);
}

export type { FilterBuilderProps };
