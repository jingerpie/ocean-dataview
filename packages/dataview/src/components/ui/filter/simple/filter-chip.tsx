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
import type { FilterCondition, WhereRule } from "@ocean-dataview/shared/types";
import { getFilterVariantFromPropertyType } from "@ocean-dataview/shared/utils";
import {
	ChevronDownIcon,
	ListFilterIcon,
	MoreHorizontalIcon,
	TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { getBadgeVariant } from "../../../../lib/utils/get-badge-variant";
import { CheckboxPickerContent } from "../../properties/checkbox-picker";
import {
	type DateRangeValue,
	RangeDatePickerContent,
	RelativeDatePickerContent,
	type RelativeToTodayValue,
	SingleDateCalendar,
} from "../../properties/date-picker";
import { ConditionPicker } from "../condition-picker";

interface FilterChipProps<T> {
	/** The filter rule */
	rule: WhereRule;
	/** The property being filtered */
	property: DataViewProperty<T>;
	/** Callback when rule changes */
	onRuleChange: (rule: WhereRule) => void;
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
	rule,
	property,
	onRuleChange,
	onRemove,
	onAddToAdvanced,
}: FilterChipProps<T>) {
	const [open, setOpen] = useState(false);

	const variant = getFilterVariantFromPropertyType(property.type);
	const label = property.label ?? String(property.id);

	const handleConditionChange = (condition: FilterCondition) => {
		onRuleChange({
			...rule,
			condition,
			value:
				condition === "isEmpty" || condition === "isNotEmpty"
					? undefined
					: rule.value,
		});
	};

	const handleValueChange = (value: unknown) => {
		onRuleChange({
			...rule,
			value,
		});
	};

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<Button size="sm" variant="secondary" />}>
				<span className="max-w-24 truncate">{label}</span>
				<ChevronDownIcon className="size-3 opacity-50" />
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80">
				{/* Header: Property + Condition + Menu */}
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						<span className="font-medium text-sm">{label}</span>
						<ConditionPicker
							condition={rule.condition}
							inline
							onConditionChange={handleConditionChange}
							variant={variant}
						/>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger render={<Button size="sm" variant="ghost" />}>
							<MoreHorizontalIcon />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-auto" side="bottom">
							<DropdownMenuItem
								onClick={() => {
									onRemove();
									setOpen(false);
								}}
								variant="destructive"
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
					onValueChange={handleValueChange}
					property={property}
					rule={rule}
					variant={variant}
				/>
			</PopoverContent>
		</Popover>
	);
}

// ============================================================================
// FilterChipValue - Value input for filter chip
// ============================================================================

interface FilterChipValueProps<T> {
	rule: WhereRule;
	property: DataViewProperty<T>;
	variant: string;
	onValueChange: (value: unknown) => void;
}

function FilterChipValue<T>({
	rule,
	property,
	variant,
	onValueChange,
}: FilterChipValueProps<T>) {
	// Empty/Not Empty conditions don't need value input
	if (rule.condition === "isEmpty" || rule.condition === "isNotEmpty") {
		return null;
	}

	switch (variant) {
		case "text":
		case "number":
		case "range":
			return (
				<Input
					inputMode={variant === "text" ? undefined : "numeric"}
					onChange={(e) => onValueChange(e.target.value)}
					placeholder="Enter value..."
					type={variant === "text" ? "text" : "number"}
					value={rule.value != null ? String(rule.value) : ""}
				/>
			);

		case "boolean":
			return (
				<CheckboxPickerContent
					onChange={onValueChange}
					value={rule.value as boolean | undefined}
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

			let selectedValues: string[];
			if (Array.isArray(rule.value)) {
				selectedValues = rule.value as string[];
			} else if (rule.value) {
				selectedValues = [rule.value as string];
			} else {
				selectedValues = [];
			}

			const selectedOptions = options.filter((o) =>
				selectedValues.includes(o.value)
			);

			return (
				<Combobox
					items={options}
					multiple
					onValueChange={(newValues) => {
						const values = (newValues as SelectOption[]).map((o) => o.value);
						onValueChange(values);
					}}
					open
					value={selectedOptions}
				>
					<ComboboxInput
						className="h-8"
						placeholder="Search options..."
						showTrigger={false}
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
			if (rule.condition === "isBetween") {
				return (
					<RangeDatePickerContent
						onChange={onValueChange}
						value={rule.value as DateRangeValue | undefined}
					/>
				);
			}
			if (rule.condition === "isRelativeToToday") {
				return (
					<RelativeDatePickerContent
						onChange={onValueChange}
						value={rule.value as RelativeToTodayValue | undefined}
					/>
				);
			}
			return (
				<SingleDateCalendar
					onChange={onValueChange}
					value={rule.value as string | undefined}
				/>
			);

		default:
			return null;
	}
}

export type { FilterChipProps };
