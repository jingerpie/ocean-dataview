"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
} from "@ocean-dataview/dataview/components/ui/combobox";
import {
	useAdvanceFilterBuilder,
	useFilterParams,
	useSearchParams,
	useSortParams,
} from "@ocean-dataview/dataview/hooks";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { PropertySort } from "@ocean-dataview/shared/types";
import {
	createDefaultCondition,
	normalizeFilter,
} from "@ocean-dataview/shared/utils";
import { ListFilterIcon, SortAscIcon } from "lucide-react";
import { type ComponentProps, type ReactNode, useState } from "react";
import { FilterPropertyPicker } from "../filter";
import { SearchInput } from "../search";
import { ToolbarButton, useToolbarState } from "../toolbar";
import { DataViewOptions } from "../visibility";
import { ActiveControlsRow } from "./active-controls-row";

interface NotionToolbarProps<T> extends ComponentProps<"div"> {
	/** Available properties for filtering/sorting */
	properties: DataViewProperty<T>[];
	/** Enable filter functionality */
	enableFilter?: boolean;
	/** Enable sort functionality */
	enableSort?: boolean;
	/** Enable search functionality */
	enableSearch?: boolean;
	/** Enable properties visibility button */
	enableProperties?: boolean;
	/** Children (tabs, etc.) - always visible on left */
	children?: ReactNode;
}

/**
 * Notion-style toolbar with two-row layout.
 *
 * State is managed internally via nuqs URL params:
 * - ?filter={...} for filters
 * - ?sort=[...] for sorting
 * - ?search=... for search
 *
 * Row 1: [children] -------- [Filter] [Sort] [Search] [Properties]
 * Row 2: [SortList] [Filter Chips...] [+ Filter] (conditional)
 *
 * @example
 * ```tsx
 * <NotionToolbar properties={productProperties}>
 *   <MyTabs />
 * </NotionToolbar>
 * ```
 */
export function NotionToolbar<T>({
	properties,
	enableFilter = true,
	enableSort = true,
	enableSearch = true,
	enableProperties = true,
	children,
	className,
	...props
}: NotionToolbarProps<T>) {
	// State managed via nuqs URL params
	const { filter, setFilter: onFilterChange } = useFilterParams();
	const { search, setSearch: onSearchChange } = useSearchParams();
	const { sort: sorts, setSort: onSortsChange } = useSortParams<T>();
	const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
	const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

	const openAdvancedFilter = useAdvanceFilterBuilder((state) => state.open);

	const {
		hasActiveControls,
		row2Visible,
		toggleRow2,
		simpleFilterConditions,
		advancedFilter,
		advancedFilterIndex,
		ruleCount,
	} = useToolbarState({ filter, sorts });

	// Handle filter button click
	const handleFilterButtonClick = () => {
		if (filter !== null) {
			// Filter exists - toggle Row 2 visibility
			toggleRow2();
		} else {
			// No filter - open dropdown
			setFilterDropdownOpen(true);
		}
	};

	// Handle sort button click
	const handleSortButtonClick = () => {
		if (sorts.length > 0) {
			// Sorts exist - toggle Row 2 visibility
			toggleRow2();
		} else {
			// No sorts - open dropdown
			setSortDropdownOpen(true);
		}
	};

	// Handle selecting a property to filter
	const handleFilterPropertySelect = (property: DataViewProperty<T>) => {
		const condition = createDefaultCondition(String(property.id));
		onFilterChange({ and: [condition] });
		setFilterDropdownOpen(false);
	};

	// Handle opening advanced filter
	const handleOpenAdvancedFilter = () => {
		setFilterDropdownOpen(false);

		// Create advanced filter structure if it doesn't exist
		const firstProperty = properties[0];
		if (firstProperty && !advancedFilter) {
			const defaultCondition = createDefaultCondition(String(firstProperty.id));

			if (filter) {
				// Has existing simple filters, add advanced filter alongside
				const normalized = normalizeFilter(filter);
				if (normalized) {
					onFilterChange({
						and: [...(normalized.and ?? []), { and: [defaultCondition] }],
					});
				}
			} else {
				// No filter exists, create new with advanced filter structure
				// { and: [{ and: [defaultCondition] }] }
				onFilterChange({ and: [{ and: [defaultCondition] }] });
			}
		}

		openAdvancedFilter();
	};

	// Handle selecting a property to sort (adds first sort)
	const handleSortPropertySelect = (property: DataViewProperty<T>) => {
		onSortsChange([
			{
				propertyId: property.id as PropertySort<T>["propertyId"],
				desc: false,
			},
		]);
		setSortDropdownOpen(false);
	};

	return (
		<div
			aria-orientation="horizontal"
			className={cn("flex flex-col gap-2", className)}
			role="toolbar"
			{...props}
		>
			{/* Row 1: Primary Toolbar */}
			<div className="flex h-9 items-center gap-2">
				{/* Left side: Children (tabs, etc.) */}
				{children && <div className="flex flex-1 gap-2">{children}</div>}

				{/* Right side: Controls */}
				<div className="ml-auto flex items-center gap-1">
					{/* Filter Button */}
					{enableFilter &&
						(filter !== null ? (
							// Filter exists - simple button to toggle Row 2
							<ToolbarButton
								icon={<ListFilterIcon />}
								isActive={true}
								label="Filter"
								onClick={handleFilterButtonClick}
							/>
						) : (
							// No filter - FilterPropertyPicker dropdown
							<FilterPropertyPicker
								onAdvancedFilter={handleOpenAdvancedFilter}
								onOpenChange={setFilterDropdownOpen}
								onSelect={handleFilterPropertySelect}
								open={filterDropdownOpen}
								properties={properties}
								variant="icon"
							/>
						))}

					{/* Sort Button */}
					{enableSort &&
						(sorts.length > 0 ? (
							// Sorts exist - simple button to toggle Row 2
							<ToolbarButton
								icon={<SortAscIcon className="size-4" />}
								isActive={true}
								label="Sort"
								onClick={handleSortButtonClick}
							/>
						) : (
							// No sorts - Combobox dropdown to pick first sort
							<Combobox
								items={properties}
								onOpenChange={setSortDropdownOpen}
								onValueChange={(value) => {
									if (value) {
										handleSortPropertySelect(value as DataViewProperty<T>);
									}
								}}
								open={sortDropdownOpen}
							>
								<ComboboxTrigger render={<Button size="sm" variant="ghost" />}>
									<SortAscIcon className="size-4" />
									<span>Sort</span>
								</ComboboxTrigger>
								<ComboboxContent align="start" className="w-56">
									<ComboboxInput placeholder="Sort by..." showTrigger={false} />
									<ComboboxEmpty>No properties found.</ComboboxEmpty>
									<ComboboxList>
										{(property) => (
											<ComboboxItem key={String(property.id)} value={property}>
												{property.label ?? String(property.id)}
											</ComboboxItem>
										)}
									</ComboboxList>
								</ComboboxContent>
							</Combobox>
						))}

					{/* Search Input */}
					{enableSearch && (
						<SearchInput
							onChange={onSearchChange}
							placeholder="Type to search..."
							value={search}
						/>
					)}

					{/* Properties Visibility */}
					{enableProperties && <DataViewOptions variant="icon" />}
				</div>
			</div>

			{/* Row 2: Active Controls (conditional) */}
			{hasActiveControls && row2Visible && (
				<ActiveControlsRow
					advancedFilter={advancedFilter}
					advancedFilterIndex={advancedFilterIndex}
					filter={filter}
					onFilterChange={onFilterChange}
					onOpenAdvancedFilter={handleOpenAdvancedFilter}
					onSortsChange={onSortsChange}
					properties={properties}
					ruleCount={ruleCount}
					simpleFilterConditions={simpleFilterConditions}
					sorts={sorts}
				/>
			)}
		</div>
	);
}

export type { NotionToolbarProps };
