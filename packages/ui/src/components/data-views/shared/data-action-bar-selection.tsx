"use client";

import { Button } from "@ocean-dataview/ui/components/button";
import { Separator } from "@ocean-dataview/ui/components/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ocean-dataview/ui/components/tooltip";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import * as React from "react";

interface DataActionBarSelectionProps<TData> {
	/**
	 * TanStack Table instance (for TableView)
	 * Optional - if not provided, use selectedCount and onClearSelection
	 */
	table?: Table<TData>;

	/**
	 * Selected count (for ListView or custom implementations)
	 */
	selectedCount?: number;

	/**
	 * Clear selection callback (for ListView or custom implementations)
	 */
	onClearSelection?: () => void;
}

/**
 * DataActionBarSelection - Shows selection count with clear button
 * Works with both TanStack Table and custom selection state
 */
export function DataActionBarSelection<TData>({
	table,
	selectedCount: selectedCountProp,
	onClearSelection,
}: DataActionBarSelectionProps<TData>) {
	const selectedCount = table
		? table.getFilteredSelectedRowModel().rows.length
		: (selectedCountProp ?? 0);

	const handleClearSelection = React.useCallback(() => {
		if (table) {
			table.toggleAllRowsSelected(false);
		} else if (onClearSelection) {
			onClearSelection();
		}
	}, [table, onClearSelection]);

	return (
		<div className="flex h-9 items-center rounded-md border pr-2 pl-3">
			<span className="whitespace-nowrap text-sm">
				{selectedCount} selected
			</span>
			<Separator orientation="vertical" className="mr-1 ml-2 h-4" />
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="size-6"
						onClick={handleClearSelection}
					>
						<X className="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent
					sideOffset={10}
					className="flex items-center gap-2 border bg-accent px-2 py-1 font-semibold text-foreground"
				>
					<p>Clear selection</p>
					<kbd className="select-none rounded border bg-background px-1.5 py-px font-mono font-normal text-[0.7rem] text-foreground shadow-sm">
						<abbr title="Escape" className="no-underline">
							Esc
						</abbr>
					</kbd>
				</TooltipContent>
			</Tooltip>
		</div>
	);
}
