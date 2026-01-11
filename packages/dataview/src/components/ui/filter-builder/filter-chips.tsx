"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { Filter } from "@ocean-dataview/shared/types";
import {
	flattenFilter,
	getConditionSummary,
	normalizeFilter,
	removeItem,
} from "@ocean-dataview/shared/utils";
import { XIcon } from "lucide-react";
import { Button } from "../button";

interface FilterChipsProps<T> {
	/** Current filter */
	filter: Filter | null;
	/** Available properties (for labels) */
	properties: DataViewProperty<T>[];
	/** Callback when a chip is clicked (to open builder at that filter) */
	onChipClick?: (path: number[]) => void;
	/** Callback when a chip's remove button is clicked */
	onChipRemove: (path: number[]) => void;
	/** Callback to clear all filters */
	onClearAll: () => void;
	/** Additional class names */
	className?: string;
}

/**
 * Displays active filters as compact chips.
 * Each chip shows the property, operator, and value.
 * Clicking a chip can open the filter builder at that filter.
 * X button removes that specific filter.
 */
export function FilterChips<T>({
	filter,
	properties,
	onChipClick,
	onChipRemove,
	onClearAll,
	className,
}: FilterChipsProps<T>) {
	// Flatten filter tree to get all conditions
	const flatConditions = flattenFilter(filter);

	if (flatConditions.length === 0) {
		return null;
	}

	// Get property label
	const getPropertyLabel = (propertyId: string): string => {
		const property = properties.find((p) => String(p.id) === propertyId);
		return property?.label ?? property?.id ?? propertyId;
	};

	// Handle remove with path
	const handleRemove = (path: number[]) => {
		const normalized = normalizeFilter(filter);
		if (!normalized) return;

		const result = removeItem(normalized, path);
		if (result) {
			// Filter still has items
			onChipRemove(path);
		} else {
			// Filter is now empty
			onClearAll();
		}
	};

	return (
		<div className={cn("flex flex-wrap items-center gap-1.5", className)}>
			{flatConditions.map(({ condition, path, depth }) => {
				const label = getPropertyLabel(condition.property);
				const summary = getConditionSummary(condition, label);

				// Show depth indicator for nested conditions
				const depthIndicator =
					depth > 0 ? `(${depth > 1 ? "nested " : ""}group)` : "";

				return (
					<div
						key={path.join("-")}
						className="group flex h-6 items-center gap-0.5 rounded-md bg-muted px-1.5 text-xs"
					>
						{/* Chip content */}
						<button
							type="button"
							className="max-w-48 truncate text-foreground hover:underline focus:outline-none focus:ring-1 focus:ring-ring"
							onClick={() => onChipClick?.(path)}
						>
							{summary}
							{depthIndicator && (
								<span className="ml-1 text-muted-foreground">
									{depthIndicator}
								</span>
							)}
						</button>

						{/* Remove button */}
						<Button
							variant="ghost"
							size="icon-sm"
							className="size-4 opacity-50 hover:opacity-100"
							onClick={(e) => {
								e.stopPropagation();
								handleRemove(path);
							}}
						>
							<XIcon className="size-3" />
							<span className="sr-only">Remove filter</span>
						</Button>
					</div>
				);
			})}

			{/* Clear all button */}
			{flatConditions.length > 1 && (
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-1.5 text-muted-foreground text-xs"
					onClick={onClearAll}
				>
					Clear all
				</Button>
			)}
		</div>
	);
}

export type { FilterChipsProps };
