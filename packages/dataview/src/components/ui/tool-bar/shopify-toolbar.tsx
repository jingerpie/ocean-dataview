"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type {
	PropertyFilter,
	PropertySort,
} from "@ocean-dataview/shared/types";
import { ListFilter, Search, X } from "lucide-react";
import * as React from "react";
import { DataViewOptions } from "./data-view-options";
import { FilterAddButton } from "./filter-add-button";
import { FilterItem } from "./filter-item";
import { SortList } from "./sort-list";

const OPEN_MENU_SHORTCUT = "f";

interface ShopifyToolbarProps<T> extends React.ComponentProps<"div"> {
	/**
	 * Property definitions for filtering/sorting
	 */
	properties: DataViewProperty<T>[];
	/**
	 * Current active filters
	 */
	filters: PropertyFilter<T>[];
	/**
	 * Callback when filters change
	 */
	onFiltersChange: (filters: PropertyFilter<T>[]) => void;
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
	 * Debounce delay in milliseconds for filter updates
	 */
	debounceMs?: number;
	/**
	 * Function to generate unique filter IDs
	 */
	generateFilterId?: () => string;
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
 * - Filter chips row with field/operator/value selectors
 * - Add filter button with Command palette
 * - Sort and view options buttons
 * - Keyboard shortcuts (f to open filter menu, Shift+F to remove last filter)
 */
export function ShopifyToolbar<T>({
	properties,
	filters,
	onFiltersChange,
	sorts,
	onSortsChange,
	searchProperties = [],
	enableSearch = true,
	enableFilters = true,
	enableSort = true,
	enableViewOptions = true,
	debounceMs = 300,
	generateFilterId = defaultGenerateFilterId,
	children,
	className,
	...props
}: ShopifyToolbarProps<T>) {
	const id = React.useId();
	const [showFilters, setShowFilters] = React.useState(false);
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

	// Debounced filter update
	const debouncedFiltersChangeRef = React.useRef<ReturnType<
		typeof setTimeout
	> | null>(null);
	const debouncedOnFiltersChange = React.useCallback(
		(newFilters: PropertyFilter<T>[]) => {
			if (debouncedFiltersChangeRef.current) {
				clearTimeout(debouncedFiltersChangeRef.current);
			}
			debouncedFiltersChangeRef.current = setTimeout(() => {
				onFiltersChange(newFilters);
			}, debounceMs);
		},
		[onFiltersChange, debounceMs],
	);

	// Handle search input change
	const handleSearch = React.useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setSearchValue(value);

			if (value.trim()) {
				// Create search filters for primary columns
				const searchFilters: PropertyFilter<T>[] = primaryProperties.map(
					(property) => ({
						propertyId: property.id as PropertyFilter<T>["propertyId"],
						value: value,
						variant: "text" as const,
						operator: "iLike" as const,
						filterId: `search-${property.id}`,
					}),
				);

				// Get non-search filters
				const nonSearchFilters = filters.filter(
					(filter) => !filter.filterId.startsWith("search-"),
				);

				debouncedOnFiltersChange([...nonSearchFilters, ...searchFilters]);
			} else {
				// Remove search filters when search is cleared
				const nonSearchFilters = filters.filter(
					(filter) => !filter.filterId.startsWith("search-"),
				);
				debouncedOnFiltersChange(nonSearchFilters);
			}
		},
		[primaryProperties, filters, debouncedOnFiltersChange],
	);

	// Handle filter update
	const onFilterUpdate = React.useCallback(
		(filterId: string, updates: Partial<PropertyFilter<T>>) => {
			const updatedFilters = filters.map((filter) =>
				filter.filterId === filterId
					? ({ ...filter, ...updates } as PropertyFilter<T>)
					: filter,
			);
			debouncedOnFiltersChange(updatedFilters);
		},
		[filters, debouncedOnFiltersChange],
	);

	// Handle filter remove
	const onFilterRemove = React.useCallback(
		(filterId: string) => {
			const updatedFilters = filters.filter(
				(filter) => filter.filterId !== filterId,
			);
			onFiltersChange(updatedFilters);
		},
		[filters, onFiltersChange],
	);

	// Handle filter add
	const onFilterAdd = React.useCallback(
		(filter: PropertyFilter<T>) => {
			onFiltersChange([...filters, filter]);
		},
		[filters, onFiltersChange],
	);

	// Reset all filters and search
	const onFiltersReset = React.useCallback(() => {
		onFiltersChange([]);
		setSearchValue("");
	}, [onFiltersChange]);

	// Check if there are any active filters or search
	const hasActiveFilters = filters.length > 0 || searchValue.trim().length > 0;

	// Get non-search filters for display
	const displayFilters = filters.filter(
		(filter) => !filter.filterId.startsWith("search-"),
	);

	// Keyboard shortcuts
	React.useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			// 'f' to toggle filter mode
			if (
				event.key.toLowerCase() === OPEN_MENU_SHORTCUT &&
				!event.ctrlKey &&
				!event.metaKey &&
				!event.shiftKey
			) {
				event.preventDefault();
				setShowFilters(true);
			}

			// Shift+F to remove last filter
			if (
				event.key.toLowerCase() === OPEN_MENU_SHORTCUT &&
				event.shiftKey &&
				displayFilters.length > 0
			) {
				event.preventDefault();
				const lastFilter = displayFilters[displayFilters.length - 1];
				if (lastFilter) {
					onFilterRemove(lastFilter.filterId);
				}
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [displayFilters, onFilterRemove]);

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

			{/* Filter chips row */}
			{showFilters && enableFilters && (
				<ul className="flex list-none flex-wrap items-center gap-2">
					{displayFilters.map((filter) => (
						<FilterItem
							key={filter.filterId}
							filter={filter}
							filterItemId={`${id}-filter-${filter.filterId}`}
							properties={filterableProperties}
							onFilterUpdate={onFilterUpdate}
							onFilterRemove={onFilterRemove}
						/>
					))}
					<li>
						<FilterAddButton
							properties={filterableProperties}
							onFilterAdd={onFilterAdd}
							generateFilterId={generateFilterId}
						/>
					</li>
				</ul>
			)}
		</div>
	);
}

/**
 * Default filter ID generator
 */
function defaultGenerateFilterId(): string {
	return Math.random().toString(36).substring(2, 10);
}

export type { ShopifyToolbarProps };
