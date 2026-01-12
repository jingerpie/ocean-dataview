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
import type { PropertySort } from "@ocean-dataview/shared/types";
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";

export interface SortOption {
	field: string;
	label: string;
}

interface SortDropdownProps<T = unknown> {
	sortOptions: SortOption[];
	sort: PropertySort<T>[];
	onSortChange: (sort: PropertySort<T>[]) => void;
}

/**
 * Dropdown component for sorting data
 * Uses PropertySort[] array for multi-column support
 * UI shows first sort as primary (single-column UI)
 */
export function SortDropdown<T = unknown>({
	sortOptions,
	sort,
	onSortChange,
}: SortDropdownProps<T>) {
	if (sortOptions.length === 0) {
		return null;
	}

	// Get primary sort (first in array)
	const primarySort = sort[0];
	const currentSort = primarySort?.propertyId ?? null;
	const currentOrder = primarySort?.desc ? "desc" : "asc";

	const activeOption = sortOptions.find((opt) => opt.field === currentSort);

	const handleSortChange = (
		field: string | null,
		order: "asc" | "desc" = "asc",
	) => {
		if (field === null) {
			onSortChange([]);
		} else {
			onSortChange([
				{
					propertyId: field as Extract<keyof T, string>,
					desc: order === "desc",
				},
			]);
		}
	};

	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
					<ArrowUpDown className="mr-2 h-4 w-4" />
					Sort
					{activeOption && (
						<Badge
							variant="secondary"
							className="ml-2 flex h-5 items-center gap-1 px-1.5"
						>
							{currentOrder === "asc" ? (
								<ArrowUp className="h-3 w-3" />
							) : (
								<ArrowDown className="h-3 w-3" />
							)}
						</Badge>
					)}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuGroup>
						<DropdownMenuLabel>Sort by</DropdownMenuLabel>
						<DropdownMenuSeparator />

						{sortOptions.map((option) => {
							const isActive = currentSort === option.field;

							return (
								<DropdownMenuItem
									key={option.field}
									onClick={() => {
										if (isActive) {
											// Toggle order if already active
											const newOrder = currentOrder === "asc" ? "desc" : "asc";
											handleSortChange(option.field, newOrder);
										} else {
											// Set new sort field with asc order
											handleSortChange(option.field, "asc");
										}
									}}
								>
									<div className="flex w-full items-center justify-between">
										<span>{option.label}</span>
										{isActive && (
											<div className="flex items-center gap-1">
												{currentOrder === "asc" ? (
													<ArrowUp className="h-4 w-4" />
												) : (
													<ArrowDown className="h-4 w-4" />
												)}
											</div>
										)}
									</div>
								</DropdownMenuItem>
							);
						})}

						{currentSort && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => handleSortChange(null)}
									className="text-destructive"
								>
									<X className="mr-2 h-4 w-4" />
									Clear sorting
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Active sort badge */}
			{activeOption && (
				<Badge variant="secondary" className="gap-1 pr-1">
					<span className="flex items-center gap-1 text-xs">
						{activeOption.label}
						{currentOrder === "asc" ? (
							<ArrowUp className="h-3 w-3" />
						) : (
							<ArrowDown className="h-3 w-3" />
						)}
					</span>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => handleSortChange(null)}
					>
						<X className="h-3 w-3" />
						<span className="sr-only">Clear sort</span>
					</Button>
				</Badge>
			)}
		</div>
	);
}
