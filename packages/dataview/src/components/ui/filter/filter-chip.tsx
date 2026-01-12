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
import {
	ChevronDownIcon,
	ListFilterIcon,
	MoreHorizontalIcon,
	TrashIcon,
} from "lucide-react";
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
	/** Callback to add this filter to advanced filter */
	onAddToAdvanced?: () => void;
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
	onAddToAdvanced,
}: FilterChipProps<T>) {
	const [open, setOpen] = React.useState(false);

	const variant = getFilterVariantFromPropertyType(property.type);
	const operators = getFilterOperators(variant);
	const label = property.label ?? String(property.id);
	const currentOperatorLabel =
		operators.find((op) => op.value === condition.operator)?.label ??
		condition.operator;

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
			<PopoverTrigger render={<Button variant="secondary" size="sm" />}>
				<span className="max-w-24 truncate">{label}</span>
				<ChevronDownIcon className="size-3 opacity-50" />
			</PopoverTrigger>
			<PopoverContent align="start" className="gap-2">
				{/* Header: Property + Operator + Menu */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="font-medium text-sm">{label}</span>
						<Select
							value={condition.operator}
							onValueChange={(val) =>
								handleOperatorChange(val as FilterOperator)
							}
						>
							<SelectTrigger size="sm" className="border-none">
								<SelectValue>{currentOperatorLabel}</SelectValue>
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
							render={<Button variant="ghost" size="icon" />}
						>
							<MoreHorizontalIcon />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" side="bottom" className="w-auto">
							<DropdownMenuItem
								variant="destructive"
								onClick={() => {
									onRemove();
									setOpen(false);
								}}
							>
								<TrashIcon />
								Delete filter
							</DropdownMenuItem>
							{onAddToAdvanced && (
								<DropdownMenuItem
									onClick={() => {
										onAddToAdvanced();
										setOpen(false);
									}}
								>
									<ListFilterIcon />
									Add to advanced filter
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<FilterValue
					condition={condition}
					property={property}
					variant={variant}
					onValueChange={handleValueChange}
				/>
			</PopoverContent>
		</Popover>
	);
}

export type { FilterChipProps };
