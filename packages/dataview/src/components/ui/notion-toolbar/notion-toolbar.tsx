"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { Filter, PropertySort } from "@ocean-dataview/shared/types";
import { createDefaultCondition } from "@ocean-dataview/shared/utils";
import { ListFilterIcon, PlusIcon, SortAscIcon } from "lucide-react";
import * as React from "react";
import { CommandItem } from "../command";
import { FilterBuilderPopover } from "../filter";
import { SearchInput } from "../search";
import { PropertySelector, ToolbarButton, useToolbarState } from "../toolbar";
import { DataViewOptions } from "../visibility";
import { ActiveControlsRow } from "./active-controls-row";

interface NotionToolbarProps<T> extends React.ComponentProps<"div"> {
	/** Available properties */
	properties: DataViewProperty<T>[];
	/** Current filter */
	filter: Filter | null;
	/** Callback when filter changes */
	onFilterChange: (filter: Filter | null) => void;
	/** Current sorts (multiple sorts supported) */
	sorts: PropertySort<T>[];
	/** Callback when sorts change */
	onSortsChange: (sorts: PropertySort<T>[]) => void;
	/** Current search value */
	search: string;
	/** Callback when search changes */
	onSearchChange: (search: string) => void;
	/** Enable filter functionality */
	enableFilter?: boolean;
	/** Enable sort functionality */
	enableSort?: boolean;
	/** Enable search functionality */
	enableSearch?: boolean;
	/** Enable properties visibility button */
	enableProperties?: boolean;
	/** Children (tabs, etc.) - always visible on left */
	children?: React.ReactNode;
}

/**
 * Notion-style toolbar with two-row layout.
 *
 * Row 1: [children] -------- [Filter] [Sort] [Search] [Properties]
 * Row 2: [Sort Chip] [Filter Chips...] [+ Filter] (conditional)
 */
export function NotionToolbar<T>({
	properties,
	filter,
	onFilterChange,
	sorts,
	onSortsChange,
	search,
	onSearchChange,
	enableFilter = true,
	enableSort = true,
	enableSearch = true,
	enableProperties = true,
	children,
	className,
	...props
}: NotionToolbarProps<T>) {
	const [filterDropdownOpen, setFilterDropdownOpen] = React.useState(false);
	const [sortDropdownOpen, setSortDropdownOpen] = React.useState(false);
	const [advancedFilterOpen, setAdvancedFilterOpen] = React.useState(false);

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
		setAdvancedFilterOpen(true);
	};

	// Footer for filter property selector
	const filterSelectorFooter = (
		<CommandItem onSelect={handleOpenAdvancedFilter}>
			<PlusIcon className="mr-2 size-4" />
			<span>Add advanced filter</span>
		</CommandItem>
	);

	// Handle selecting a property to sort (adds a new sort)
	const handleSortPropertySelect = (property: DataViewProperty<T>) => {
		onSortsChange([
			...sorts,
			{
				propertyId: property.id as PropertySort<T>["propertyId"],
				desc: false,
			},
		]);
		setSortDropdownOpen(false);
	};

	return (
		<div
			className={cn("flex flex-col gap-2", className)}
			role="toolbar"
			aria-orientation="horizontal"
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
								icon={<ListFilterIcon className="size-4" />}
								label="Filter"
								isActive={true}
								onClick={handleFilterButtonClick}
							/>
						) : (
							// No filter - button with dropdown
							<ToolbarButton
								icon={<ListFilterIcon className="size-4" />}
								label="Filter"
								isActive={false}
								open={filterDropdownOpen}
								onOpenChange={setFilterDropdownOpen}
								dropdownContent={
									<PropertySelector
										properties={properties}
										onSelect={handleFilterPropertySelect}
										placeholder="Filter by..."
										footer={filterSelectorFooter}
									/>
								}
							/>
						))}

					{/* Sort Button */}
					{enableSort &&
						(sorts.length > 0 ? (
							// Sorts exist - simple button to toggle Row 2
							<ToolbarButton
								icon={<SortAscIcon className="size-4" />}
								label="Sort"
								isActive={true}
								onClick={handleSortButtonClick}
							/>
						) : (
							// No sorts - button with dropdown
							<ToolbarButton
								icon={<SortAscIcon className="size-4" />}
								label="Sort"
								isActive={false}
								open={sortDropdownOpen}
								onOpenChange={setSortDropdownOpen}
								dropdownContent={
									<PropertySelector
										properties={properties}
										onSelect={handleSortPropertySelect}
										placeholder="Sort by..."
									/>
								}
							/>
						))}

					{/* Search Input */}
					{enableSearch && (
						<SearchInput
							value={search}
							onChange={onSearchChange}
							placeholder="Type to search..."
						/>
					)}

					{/* Properties Visibility */}
					{enableProperties && <DataViewOptions variant="icon" />}
				</div>
			</div>

			{/* Row 2: Active Controls (conditional) */}
			{hasActiveControls && row2Visible && (
				<ActiveControlsRow
					sorts={sorts}
					onSortsChange={onSortsChange}
					filter={filter}
					onFilterChange={onFilterChange}
					properties={properties}
					advancedFilter={advancedFilter}
					advancedFilterIndex={advancedFilterIndex}
					simpleFilterConditions={simpleFilterConditions}
					ruleCount={ruleCount}
					onOpenAdvancedFilter={handleOpenAdvancedFilter}
				/>
			)}

			{/* Advanced Filter Popover (controlled externally) */}
			<FilterBuilderPopover
				properties={properties}
				filter={filter}
				onChange={onFilterChange}
				open={advancedFilterOpen}
				onOpenChange={setAdvancedFilterOpen}
				trigger={
					<button type="button" className="sr-only">
						Advanced filter
					</button>
				}
			/>
		</div>
	);
}

export type { NotionToolbarProps };
