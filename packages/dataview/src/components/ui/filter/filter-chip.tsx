"use client";

import { Badge } from "@ocean-dataview/dataview/components/ui/badge";
import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Combobox,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@ocean-dataview/dataview/components/ui/combobox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ocean-dataview/dataview/components/ui/dropdown-menu";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import type {
	DataViewProperty,
	SelectOption,
} from "@ocean-dataview/dataview/types";
import type {
	FilterCondition,
	FilterOperator,
} from "@ocean-dataview/shared/types";
import { getFilterVariantFromPropertyType } from "@ocean-dataview/shared/utils";
import {
	ChevronDownIcon,
	ListFilterIcon,
	MoreHorizontalIcon,
	TrashIcon,
} from "lucide-react";
import * as React from "react";
import { getBadgeVariant } from "../../../lib/utils/get-badge-variant";
import { BooleanPicker } from "../properties/boolean-picker";
import {
	DatePickerCalendar,
	DateRangePicker,
	type DateRangeValue,
} from "../properties/date-picker";
import { OperatorPicker } from "./operator-picker";

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
			<PopoverTrigger render={<Button variant="secondary" size="sm" />}>
				<span className="max-w-24 truncate">{label}</span>
				<ChevronDownIcon className="size-3 opacity-50" />
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto">
				{/* Header: Property + Operator + Menu */}
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						<span className="font-medium text-sm">{label}</span>
						<OperatorPicker
							value={condition.operator}
							onChange={handleOperatorChange}
							variant={variant}
							appearance="inline"
						/>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
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

				{/* Value Input */}
				<FilterChipValue
					condition={condition}
					property={property}
					variant={variant}
					onValueChange={handleValueChange}
				/>
			</PopoverContent>
		</Popover>
	);
}

// ============================================================================
// FilterChipValue - Value input for filter chip
// ============================================================================

interface FilterChipValueProps<T> {
	condition: FilterCondition;
	property: DataViewProperty<T>;
	variant: string;
	onValueChange: (value: unknown) => void;
}

function FilterChipValue<T>({
	condition,
	property,
	variant,
	onValueChange,
}: FilterChipValueProps<T>) {
	// Empty/Not Empty operators don't need value input
	if (condition.operator === "isEmpty" || condition.operator === "isNotEmpty") {
		return null;
	}

	switch (variant) {
		case "text":
		case "number":
		case "range":
			return (
				<Input
					type={variant === "text" ? "text" : "number"}
					inputMode={variant === "text" ? undefined : "numeric"}
					placeholder="Enter value..."
					value={condition.value != null ? String(condition.value) : ""}
					onChange={(e) => onValueChange(e.target.value)}
				/>
			);

		case "boolean":
			return (
				<BooleanPicker
					value={condition.value as string | undefined}
					onChange={onValueChange}
				/>
			);

		case "select":
		case "multiSelect": {
			const options: SelectOption[] =
				(property.type === "select" ||
					property.type === "status" ||
					property.type === "multiSelect") &&
				property.config?.options
					? property.config.options
					: [];

			const selectedValues = Array.isArray(condition.value)
				? (condition.value as string[])
				: condition.value
					? [condition.value as string]
					: [];

			const selectedOptions = options.filter((o) =>
				selectedValues.includes(o.value),
			);

			return (
				<Combobox
					multiple
					open
					items={options}
					value={selectedOptions}
					onValueChange={(newValues) => {
						const values = (newValues as SelectOption[]).map((o) => o.value);
						onValueChange(values);
					}}
				>
					<ComboboxInput
						showTrigger={false}
						placeholder="Search options..."
						className="h-8"
					/>
					<ComboboxEmpty>No options found.</ComboboxEmpty>
					<ComboboxList className="max-h-48">
						{(option: SelectOption) => (
							<ComboboxItem key={option.value} value={option}>
								<Badge variant={getBadgeVariant(option.color)}>
									{option.label}
								</Badge>
							</ComboboxItem>
						)}
					</ComboboxList>
				</Combobox>
			);
		}

		case "date":
		case "dateRange":
			if (condition.operator === "isBetween") {
				return (
					<DateRangePicker
						value={condition.value as DateRangeValue | undefined}
						onChange={onValueChange}
					/>
				);
			}
			return (
				<DatePickerCalendar
					value={condition.value as string | undefined}
					onChange={onValueChange}
				/>
			);

		default:
			return null;
	}
}

export type { FilterChipProps };
