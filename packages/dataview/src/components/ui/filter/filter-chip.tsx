"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ocean-dataview/dataview/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type {
	FilterCondition,
	FilterOperator,
} from "@ocean-dataview/shared/types";
import {
	getFilterOperators,
	getFilterVariantFromPropertyType,
} from "@ocean-dataview/shared/utils";
import { ChevronDownIcon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import * as React from "react";
import { FilterValue } from "./filter-rule";

interface FilterChipProps<T> {
	/** The filter condition */
	condition: FilterCondition;
	/** The property being filtered */
	property: DataViewProperty<T>;
	/** Callback when condition changes */
	onConditionChange: (condition: FilterCondition) => void;
	/** Callback to remove this filter */
	onRemove: () => void;
}

/**
 * Simple filter chip with inline editor popover.
 * Appearance: [◉ Property ▾]
 */
export function FilterChip<T>({
	condition,
	property,
	onConditionChange,
	onRemove,
}: FilterChipProps<T>) {
	const [open, setOpen] = React.useState(false);

	const variant = getFilterVariantFromPropertyType(property.type);
	const operators = getFilterOperators(variant);
	const label = property.label ?? String(property.id);

	const handleOperatorChange = (operator: FilterOperator) => {
		onConditionChange({
			...condition,
			operator,
			value:
				operator === "isEmpty" || operator === "isNotEmpty"
					? undefined
					: condition.value,
		});
	};

	const handleValueChange = (value: unknown) => {
		onConditionChange({
			...condition,
			value,
		});
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="secondary"
						size="sm"
						className="h-7 gap-1 px-2 text-xs"
					/>
				}
			>
				<span className="max-w-24 truncate">{label}</span>
				<ChevronDownIcon className="size-3 opacity-50" />
			</PopoverTrigger>
			<PopoverContent align="start" className="w-64 p-0">
				{/* Header: Property + Operator + Menu */}
				<div className="flex items-center justify-between border-b px-3 py-2">
					<div className="flex items-center gap-2">
						<span className="font-medium text-sm">{label}</span>
						<Select
							value={condition.operator}
							onValueChange={(val) =>
								handleOperatorChange(val as FilterOperator)
							}
						>
							<SelectTrigger
								size="sm"
								className="h-7 w-auto gap-1 border-0 bg-transparent p-0 shadow-none"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{operators.map((op) => (
									<SelectItem key={op.value} value={op.value}>
										{op.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button variant="ghost" size="sm" className="h-7 w-7 p-0" />
							}
						>
							<MoreHorizontalIcon className="size-4" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									onRemove();
									setOpen(false);
								}}
								className="text-destructive focus:text-destructive"
							>
								<TrashIcon className="mr-2 size-4" />
								Remove filter
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Value input */}
				<div className="p-3">
					<FilterValue
						condition={condition}
						property={property}
						variant={variant}
						onValueChange={handleValueChange}
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export type { FilterChipProps };
