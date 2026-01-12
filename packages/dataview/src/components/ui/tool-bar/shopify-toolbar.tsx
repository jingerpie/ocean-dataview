"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { Filter, PropertySort } from "@ocean-dataview/shared/types";
import { normalizeFilter, removeItem } from "@ocean-dataview/shared/utils";
import { ListFilter, Search, X } from "lucide-react";
import * as React from "react";
import { FilterBuilderPopover, FilterChips } from "../filter";
import { SortList } from "../sort";
import { DataViewOptions } from "../visibility";

const OPEN_MENU_SHORTCUT = "f";

interface ShopifyToolbarProps<T> extends React.ComponentProps<"div"> {
	/**
	 * Property definitions for filtering/sorting
	 */
	properties: DataViewProperty<T>[];
	/**
	 * Current active filter (using new recursive Filter type)
	 */
	filter: Filter | null;
	/**
	 * Callback when filter changes
	 */
	onFilterChange: (filter: Filter | null) => void;
	/**
	 * Current active sorts
	 */
	sorts: PropertySort<T>[];
	/**
	 * Callback when sorts change
	 */
	onSortsChange: (sorts: PropertySort<T>[]) => void;
	/**
	 * Properties to use for search (primary columns)
	 */
	searchProperties?: (keyof T)[];
	/**
	 * Enable search input
	 */
	enableSearch?: boolean;
	/**
	 * Enable filter functionality
	 */
	enableFilters?: boolean;
	/**
	 * Enable sort functionality
	 */
	enableSort?: boolean;
	/**
	 * Enable view options
	 */
	enableViewOptions?: boolean;
	/**
	 * Children to show when not in filter mode
	 */
	children?: React.ReactNode;
}

/**
 * Shopify-style toolbar with inline filter chips
 *
 * Features:
 * - Toggle between children and filter mode
 * - Search input for primary properties
 * - Filter chips with Notion-style filter builder popover
 * - Sort and view options buttons
 * - Keyboard shortcuts (f to open filter popover)
 */
export function ShopifyToolbar<T>({
	properties,
	filter,
	onFilterChange,
	sorts,
	onSortsChange,
	searchProperties = [],
	enableSearch = true,
	enableFilters = true,
	enableSort = true,
	enableViewOptions = true,
	children,
	className,
	...props
}: ShopifyToolbarProps<T>) {
	const [showFilters, setShowFilters] = React.useState(false);
	const [filterPopoverOpen, setFilterPopoverOpen] = React.useState(false);
	const [searchValue, setSearchValue] = React.useState("");

	// Get filterable properties (exclude primary/search columns)
	const filterableProperties = React.useMemo(() => {
		return properties.filter(
			(property) => !searchProperties.includes(property.id as keyof T),
		);
	}, [properties, searchProperties]);

	// Get primary properties for search
	const primaryProperties = React.useMemo(() => {
		return properties.filter((property) =>
			searchProperties.includes(property.id as keyof T),
		);
	}, [properties, searchProperties]);

	// Handle search input change
	// TODO: Integrate search with the new Filter type
	const handleSearch = React.useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setSearchValue(value);
			// Search integration with Filter type can be added later
		},
		[],
	);

	// Handle chip remove - removes a specific condition by path
	const handleChipRemove = React.useCallback(
		(path: number[]) => {
			const normalized = normalizeFilter(filter);
			if (!normalized) return;

			const result = removeItem(normalized, path);
			onFilterChange(result);
		},
		[filter, onFilterChange],
	);

	// Reset all filters and search
	const onFiltersReset = React.useCallback(() => {
		onFilterChange(null);
		setSearchValue("");
	}, [onFilterChange]);

	// Check if there are any active filters or search
	const hasActiveFilters = filter !== null || searchValue.trim().length > 0;

	// Keyboard shortcuts
	React.useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			// 'f' to toggle filter mode and open popover
			if (
				event.key.toLowerCase() === OPEN_MENU_SHORTCUT &&
				!event.ctrlKey &&
				!event.metaKey &&
				!event.shiftKey
			) {
				event.preventDefault();
				setShowFilters(true);
				setFilterPopoverOpen(true);
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<div
			className={cn("flex flex-col gap-2", className)}
			role="toolbar"
			aria-orientation="horizontal"
			{...props}
		>
			<div className="flex h-9 items-center gap-2">
				{!showFilters ? (
					<div className="flex flex-1 gap-2">{children}</div>
				) : (
					<div className="flex flex-1 gap-2">
						{enableSearch && primaryProperties.length > 0 && (
							<Input
								type="text"
								placeholder="Search..."
								value={searchValue}
								onChange={handleSearch}
								className="h-8 w-full"
							/>
						)}
						{hasActiveFilters && (
							<Button
								aria-label="Reset all filters and search"
								variant="outline"
								size="icon"
								className="size-8"
								onClick={onFiltersReset}
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>
				)}

				{/* Toggle filter mode button */}
				{enableFilters && (
					<Button
						variant="outline"
						size="sm"
						className="h-8 rounded-lg px-3"
						onClick={() => setShowFilters(!showFilters)}
					>
						<Search className="h-4 w-4" />
						<ListFilter className="h-4 w-4" />
					</Button>
				)}

				{/* View options */}
				{enableViewOptions && <DataViewOptions variant="icon" />}

				{/* Sort list */}
				{enableSort && (
					<SortList
						properties={properties}
						sorts={sorts}
						onSortsChange={onSortsChange}
						align="end"
					/>
				)}
			</div>

			{/* Filter chips row with filter builder popover */}
			{showFilters && enableFilters && (
				<div className="flex flex-wrap items-center gap-2">
					{/* Filter chips showing active filters */}
					<FilterChips
						filter={filter}
						properties={filterableProperties}
						onChipRemove={handleChipRemove}
						onClearAll={() => onFilterChange(null)}
					/>

					{/* Filter builder popover */}
					<FilterBuilderPopover
						properties={filterableProperties}
						filter={filter}
						onChange={onFilterChange}
						open={filterPopoverOpen}
						onOpenChange={setFilterPopoverOpen}
					/>
				</div>
			)}
		</div>
	);
}

export type { ShopifyToolbarProps };
