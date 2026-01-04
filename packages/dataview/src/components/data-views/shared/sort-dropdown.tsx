"use client";

import { Badge } from "@ocean-dataview/dataview/components/ui/badge";
import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ocean-dataview/dataview/components/ui/dropdown-menu";
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";

export interface SortOption {
	field: string;
	label: string;
}

interface SortDropdownProps {
	sortOptions: SortOption[];
	currentSort: string | null;
	currentOrder: "asc" | "desc";
	onSortChange: (field: string | null, order?: "asc" | "desc") => void;
}

/**
 * Dropdown component for sorting data
 * Updates URL parameters via callbacks
 */
export function SortDropdown({
	sortOptions,
	currentSort,
	currentOrder,
	onSortChange,
}: SortDropdownProps) {
	if (sortOptions.length === 0) {
		return null;
	}

	const activeOption = sortOptions.find((opt) => opt.field === currentSort);

	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger
					render={<Button variant="outline" size="sm" className="h-9" />}
				>
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
										onSortChange(option.field, newOrder);
									} else {
										// Set new sort field with asc order
										onSortChange(option.field, "asc");
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
								onClick={() => onSortChange(null)}
								className="text-destructive"
							>
								<X className="mr-2 h-4 w-4" />
								Clear sorting
							</DropdownMenuItem>
						</>
					)}
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
						size="sm"
						className="h-4 w-4 p-0 hover:bg-transparent"
						onClick={() => onSortChange(null)}
					>
						<X className="h-3 w-3" />
						<span className="sr-only">Clear sort</span>
					</Button>
				</Badge>
			)}
		</div>
	);
}
