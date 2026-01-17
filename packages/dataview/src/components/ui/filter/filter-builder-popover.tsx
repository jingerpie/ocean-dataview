"use client";

import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { WhereNode } from "@ocean-dataview/shared/types";
import { FilterIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Button } from "../button";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { FilterBuilder } from "./filter-builder";

interface FilterBuilderPopoverProps<T> {
	/** Available properties to filter on */
	properties: DataViewProperty<T>[];
	/** Current filter */
	filter: WhereNode | null;
	/** Callback when filter changes */
	onChange: (filter: WhereNode | null) => void;
	/** Custom trigger element (must be a ReactElement for render prop) */
	trigger?: ReactElement;
	/** Whether the popover is open (controlled) */
	open?: boolean;
	/** Callback when open state changes (controlled) */
	onOpenChange?: (open: boolean) => void;
	/** Additional class names for the trigger */
	triggerClassName?: string;
	/** Additional class names for the content */
	contentClassName?: string;
}

/**
 * Popover wrapper for the filter builder.
 * Provides a trigger button and positions the filter builder below it.
 */
export function FilterBuilderPopover<T>({
	properties,
	filter,
	onChange,
	trigger,
	open,
	onOpenChange,
	triggerClassName,
	contentClassName,
}: FilterBuilderPopoverProps<T>) {
	const hasFilters = filter !== null;

	const defaultTrigger = (
		<Button
			className={triggerClassName}
			size="sm"
			variant={hasFilters ? "secondary" : "outline"}
		>
			<FilterIcon className="size-3.5" />
			<span>Filter</span>
			{hasFilters && (
				<span className="ml-0.5 rounded bg-primary/20 px-1 font-medium text-xs">
					Active
				</span>
			)}
		</Button>
	);

	return (
		<Popover onOpenChange={onOpenChange} open={open}>
			<PopoverTrigger render={trigger ?? defaultTrigger} />
			<PopoverContent
				align="start"
				className={cn("w-auto min-w-80 p-3", contentClassName)}
			>
				<FilterBuilder
					filter={filter}
					onChange={onChange}
					onDelete={() => onOpenChange?.(false)}
					properties={properties}
				/>
			</PopoverContent>
		</Popover>
	);
}

export type { FilterBuilderPopoverProps };
