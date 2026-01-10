"use client";

import { Badge } from "@ocean-dataview/dataview/components/ui/badge";
import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ocean-dataview/dataview/components/ui/dropdown-menu";
import type {
	FilterOperator,
	FilterVariant,
	PropertyFilter,
} from "@ocean-dataview/shared/types";
import { Filter, X } from "lucide-react";

export interface FilterOption {
	label: string;
	value: string;
}

export interface FilterDefinition {
	field: string;
	label: string;
	options: FilterOption[];
	variant?: FilterVariant;
}

/**
 * Default operator inference based on filter variant
 */
const defaultOperatorForVariant: Record<FilterVariant, FilterOperator> = {
	text: "iLike",
	number: "eq",
	range: "isBetween",
	date: "eq",
	dateRange: "isBetween",
	boolean: "eq",
	select: "eq",
	multiSelect: "inArray",
};

interface FilterDropdownProps<T = unknown> {
	filterDefinitions: FilterDefinition[];
	activeFilters: PropertyFilter<T>[];
	onFilterChange: (filter: PropertyFilter<T>) => void;
	onRemoveFilter: (propertyId: string) => void;
	onClearAll: () => void;
}

/**
 * Dropdown component for applying filters
 * Uses PropertyFilter for full type safety and operator support
 */
export function FilterDropdown<T = unknown>({
	filterDefinitions,
	activeFilters,
	onFilterChange,
	onRemoveFilter,
	onClearAll,
}: FilterDropdownProps<T>) {
	const activeCount = activeFilters.length;

	// Helper to get current filter value
	const getFilterValue = (propertyId: string) =>
		activeFilters.find((f) => f.propertyId === propertyId)?.value;

	if (filterDefinitions.length === 0) {
		return null;
	}

	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger
					render={<Button variant="outline" size="sm" className="h-9" />}
				>
					<Filter className="mr-2 h-4 w-4" />
					Filters
					{activeCount > 0 && (
						<Badge variant="secondary" className="ml-2 h-5 px-1.5">
							{activeCount}
						</Badge>
					)}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuGroup>
						<DropdownMenuLabel>Filter by</DropdownMenuLabel>
						<DropdownMenuSeparator />

						{filterDefinitions.map((definition) => {
							const currentValue = getFilterValue(definition.field);

							return (
								<DropdownMenuGroup key={definition.field}>
									<DropdownMenuLabel className="px-2 py-1.5 font-normal text-muted-foreground text-xs">
										{definition.label}
									</DropdownMenuLabel>
									{definition.options.map((option) => {
										const isActive = currentValue === option.value;
										const variant = definition.variant ?? "select";

										return (
											<DropdownMenuItem
												key={option.value}
												onClick={() => {
													if (isActive) {
														onRemoveFilter(definition.field);
													} else {
														onFilterChange({
															propertyId:
																definition.field as PropertyFilter<T>["propertyId"],
															value: option.value,
															variant,
															operator: defaultOperatorForVariant[variant],
															filterId: definition.field,
														});
													}
												}}
												className="pl-6"
											>
												<div className="flex w-full items-center justify-between">
													<span>{option.label}</span>
													{isActive && (
														<Badge variant="default" className="h-5 text-xs">
															Active
														</Badge>
													)}
												</div>
											</DropdownMenuItem>
										);
									})}
								</DropdownMenuGroup>
							);
						})}

						{activeCount > 0 && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={onClearAll}
									className="text-destructive"
								>
									<X className="mr-2 h-4 w-4" />
									Clear all filters
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Active filter badges */}
			{activeCount > 0 && (
				<div className="flex flex-wrap items-center gap-2">
					{activeFilters.map((activeFilter) => {
						const definition = filterDefinitions.find(
							(d) => d.field === activeFilter.propertyId,
						);
						const option = definition?.options.find(
							(o) => o.value === activeFilter.value,
						);

						if (!definition || !option) return null;

						return (
							<Badge
								key={activeFilter.propertyId}
								variant="secondary"
								className="gap-1 pr-1"
							>
								<span className="text-xs">
									{definition.label}: {option.label}
								</span>
								<Button
									variant="ghost"
									size="sm"
									className="h-4 w-4 p-0 hover:bg-transparent"
									onClick={() => onRemoveFilter(activeFilter.propertyId)}
								>
									<X className="h-3 w-3" />
									<span className="sr-only">Remove filter</span>
								</Button>
							</Badge>
						);
					})}
				</div>
			)}
		</div>
	);
}
