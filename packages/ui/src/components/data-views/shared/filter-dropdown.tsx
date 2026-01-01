"use client";

import { Badge } from "@ocean-dataview/ui/components/badge";
import { Button } from "@ocean-dataview/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ocean-dataview/ui/components/dropdown-menu";
import { Filter, X } from "lucide-react";

export interface FilterOption {
	label: string;
	value: string;
}

export interface FilterDefinition {
	field: string;
	label: string;
	options: FilterOption[];
}

interface FilterDropdownProps {
	filters: FilterDefinition[];
	activeFilters: Record<string, unknown>;
	onFilterChange: (field: string, value: unknown) => void;
	onClearAll: () => void;
}

/**
 * Dropdown component for applying filters
 * Updates URL parameters via callbacks
 */
export function FilterDropdown({
	filters,
	activeFilters,
	onFilterChange,
	onClearAll,
}: FilterDropdownProps) {
	const activeCount = Object.keys(activeFilters).length;

	if (filters.length === 0) {
		return null;
	}

	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" className="h-9">
						<Filter className="mr-2 h-4 w-4" />
						Filters
						{activeCount > 0 && (
							<Badge variant="secondary" className="ml-2 h-5 px-1.5">
								{activeCount}
							</Badge>
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuLabel>Filter by</DropdownMenuLabel>
					<DropdownMenuSeparator />

					{filters.map((filter) => (
						<div key={filter.field}>
							<DropdownMenuLabel className="px-2 py-1.5 font-normal text-muted-foreground text-xs">
								{filter.label}
							</DropdownMenuLabel>
							{filter.options.map((option) => {
								const isActive = activeFilters[filter.field] === option.value;

								return (
									<DropdownMenuItem
										key={option.value}
										onClick={() =>
											onFilterChange(
												filter.field,
												isActive ? null : option.value,
											)
										}
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
						</div>
					))}

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
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Active filter badges */}
			{activeCount > 0 && (
				<div className="flex flex-wrap items-center gap-2">
					{Object.entries(activeFilters).map(([field, value]) => {
						const filter = filters.find((f) => f.field === field);
						const option = filter?.options.find((o) => o.value === value);

						if (!filter || !option) return null;

						return (
							<Badge key={field} variant="secondary" className="gap-1 pr-1">
								<span className="text-xs">
									{filter.label}: {option.label}
								</span>
								<Button
									variant="ghost"
									size="sm"
									className="h-4 w-4 p-0 hover:bg-transparent"
									onClick={() => onFilterChange(field, null)}
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
