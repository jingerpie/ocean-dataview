"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ocean-dataview/dataview/components/ui/command";
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
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type {
	FilterOperator,
	PropertyFilter,
} from "@ocean-dataview/shared/types";
import {
	getDefaultFilterOperator,
	getFilterOperators,
} from "@ocean-dataview/shared/utils";
import { Check, X } from "lucide-react";
import * as React from "react";
import { FilterValueInput } from "./filter-value-input";
import { RangeFilter } from "./range-filter";

const REMOVE_FILTER_SHORTCUTS = ["backspace", "delete"];

interface FilterItemProps<T> {
	filter: PropertyFilter<T>;
	filterItemId: string;
	properties: DataViewProperty<T>[];
	onFilterUpdate: (
		filterId: string,
		updates: Partial<PropertyFilter<T>>,
	) => void;
	onFilterRemove: (filterId: string) => void;
}

/**
 * Individual filter chip with:
 * - Field selector (Command popover)
 * - Operator selector (Select dropdown)
 * - Value input (varies by type)
 * - Remove button
 */
export function FilterItem<T>({
	filter,
	filterItemId,
	properties,
	onFilterUpdate,
	onFilterRemove,
}: FilterItemProps<T>) {
	const [showFieldSelector, setShowFieldSelector] = React.useState(false);
	const [showOperatorSelector, setShowOperatorSelector] = React.useState(false);
	const [showValueSelector, setShowValueSelector] = React.useState(false);

	const onItemKeyDown = React.useCallback(
		(event: React.KeyboardEvent<HTMLLIElement>) => {
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			if (showFieldSelector || showOperatorSelector || showValueSelector) {
				return;
			}

			if (REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase())) {
				event.preventDefault();
				onFilterRemove(filter.filterId);
			}
		},
		[
			filter.filterId,
			showFieldSelector,
			showOperatorSelector,
			showValueSelector,
			onFilterRemove,
		],
	);

	// Find the property for this filter
	const property = properties.find((p) => p.id === filter.propertyId);
	if (!property) return null;

	const operatorListboxId = `${filterItemId}-operator-listbox`;
	const inputId = `${filterItemId}-input`;

	const filterOperators = getFilterOperators(filter.variant);

	// Check if we should show range input
	const showRangeInput =
		(filter.variant === "range" || filter.variant === "number") &&
		filter.operator === "isBetween";

	return (
		<li
			key={filter.filterId}
			id={filterItemId}
			className="flex h-8 items-center rounded-md bg-background"
			onKeyDown={onItemKeyDown}
		>
			{/* Field Selector */}
			<Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
				<PopoverTrigger
					render={
						<Button
							variant="ghost"
							size="sm"
							className="rounded-none rounded-l-md border border-r-0 font-normal dark:bg-input/30"
						/>
					}
				>
					{property.label ?? property.id}
				</PopoverTrigger>
				<PopoverContent align="start" className="w-48 p-0">
					<Command loop>
						<CommandInput placeholder="Search fields..." />
						<CommandList>
							<CommandEmpty>No fields found.</CommandEmpty>
							<CommandGroup>
								{properties.map((prop) => {
									// Map property type to filter variant
									const variant = getFilterVariantFromPropertyType(prop.type);

									return (
										<CommandItem
											key={prop.id}
											value={prop.id}
											onSelect={() => {
												onFilterUpdate(filter.filterId, {
													propertyId:
														prop.id as PropertyFilter<T>["propertyId"],
													variant,
													operator: getDefaultFilterOperator(variant),
													value: "",
												});
												setShowFieldSelector(false);
											}}
										>
											<span className="truncate">{prop.label ?? prop.id}</span>
											<Check
												className={cn(
													"ml-auto",
													prop.id === filter.propertyId
														? "opacity-100"
														: "opacity-0",
												)}
											/>
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{/* Operator Selector */}
			<Select
				open={showOperatorSelector}
				onOpenChange={setShowOperatorSelector}
				value={filter.operator}
				onValueChange={(value) => {
					if (!value) return;
					onFilterUpdate(filter.filterId, {
						operator: value as FilterOperator,
						value:
							value === "isEmpty" || value === "isNotEmpty" ? "" : filter.value,
					});
				}}
			>
				<SelectTrigger
					aria-controls={operatorListboxId}
					className="h-8 rounded-none border-r-0 px-2.5 lowercase [&[data-size]]:h-8 [&_svg]:hidden"
				>
					<SelectValue />
				</SelectTrigger>
				<SelectContent id={operatorListboxId}>
					{filterOperators.map((operator) => (
						<SelectItem
							key={operator.value}
							className="lowercase"
							value={operator.value}
						>
							{operator.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{/* Value Input */}
			{showRangeInput ? (
				<RangeFilter
					filter={filter}
					property={property}
					inputId={inputId}
					onValueChange={(value) => onFilterUpdate(filter.filterId, { value })}
					className="max-w-28 [&_input]:h-8"
				/>
			) : (
				<FilterValueInput
					filter={filter}
					property={property}
					inputId={inputId}
					onValueChange={(value) => onFilterUpdate(filter.filterId, { value })}
					showValueSelector={showValueSelector}
					onShowValueSelectorChange={setShowValueSelector}
				/>
			)}

			{/* Remove Button */}
			<Button
				aria-controls={filterItemId}
				variant="ghost"
				size="sm"
				className="h-full rounded-none rounded-r-md border border-l-0 px-1.5 font-normal dark:bg-input/30"
				onClick={() => onFilterRemove(filter.filterId)}
			>
				<X className="size-3.5" />
			</Button>
		</li>
	);
}

/**
 * Maps DataViewProperty type to FilterVariant
 */
function getFilterVariantFromPropertyType(
	type: DataViewProperty<unknown>["type"],
): PropertyFilter<unknown>["variant"] {
	switch (type) {
		case "text":
		case "url":
		case "email":
		case "phone":
			return "text";
		case "number":
			return "number";
		case "select":
		case "status":
			return "select";
		case "multi-select":
			return "multiSelect";
		case "date":
			return "date";
		case "checkbox":
			return "boolean";
		default:
			return "text";
	}
}

export type { FilterItemProps };
