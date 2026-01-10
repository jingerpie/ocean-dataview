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
import type {
	DataViewProperty,
	SelectOption,
} from "@ocean-dataview/dataview/types";
import type { PropertyFilter } from "@ocean-dataview/shared/types";
import { getDefaultFilterOperator } from "@ocean-dataview/shared/utils";
import { Calendar } from "@ocean-dataview/ui/components/calendar";
import { BadgeCheck, Plus, Text } from "lucide-react";
import * as React from "react";

const REMOVE_FILTER_SHORTCUTS = ["backspace", "delete"];

interface FilterAddButtonProps<T> {
	properties: DataViewProperty<T>[];
	onFilterAdd: (filter: PropertyFilter<T>) => void;
	generateFilterId: () => string;
}

/**
 * Add filter button with Command palette
 * - Select field → shows value input
 * - Add filter on selection
 */
export function FilterAddButton<T>({
	properties,
	onFilterAdd,
	generateFilterId,
}: FilterAddButtonProps<T>) {
	const [open, setOpen] = React.useState(false);
	const [selectedProperty, setSelectedProperty] =
		React.useState<DataViewProperty<T> | null>(null);
	const [inputValue, setInputValue] = React.useState("");
	const inputRef = React.useRef<HTMLInputElement>(null);

	const onOpenChange = React.useCallback((open: boolean) => {
		setOpen(open);

		if (!open) {
			setTimeout(() => {
				setSelectedProperty(null);
				setInputValue("");
			}, 100);
		}
	}, []);

	const onInputKeyDown = React.useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (
				REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase()) &&
				!inputValue &&
				selectedProperty
			) {
				event.preventDefault();
				setSelectedProperty(null);
			}
		},
		[inputValue, selectedProperty],
	);

	const handleFilterAdd = React.useCallback(
		(property: DataViewProperty<T>, value: string) => {
			const variant = getFilterVariantFromPropertyType(property.type);
			// Don't require value for boolean filters
			if (!value.trim() && variant !== "boolean") {
				return;
			}

			const filterValue = variant === "multiSelect" ? [value] : value;

			const newFilter: PropertyFilter<T> = {
				propertyId: property.id as PropertyFilter<T>["propertyId"],
				value: filterValue,
				variant,
				operator: getDefaultFilterOperator(variant),
				filterId: generateFilterId(),
			};

			onFilterAdd(newFilter);
			setOpen(false);

			setTimeout(() => {
				setSelectedProperty(null);
				setInputValue("");
			}, 100);
		},
		[onFilterAdd, generateFilterId],
	);

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className="h-8"
						role="combobox"
						aria-expanded={open}
						aria-label="Show filter menu"
					/>
				}
			>
				Add Filter
				<Plus className="h-4 w-4" />
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-full max-w-[var(--available-width)] p-0"
			>
				<Command loop className="[&_[cmdk-input-wrapper]_svg]:hidden">
					<CommandInput
						ref={inputRef}
						placeholder={
							selectedProperty
								? (selectedProperty.label ?? selectedProperty.id)
								: "Search fields..."
						}
						value={inputValue}
						onValueChange={setInputValue}
						onKeyDown={onInputKeyDown}
					/>
					<CommandList>
						{selectedProperty ? (
							<>
								{(selectedProperty.type === "select" ||
									selectedProperty.type === "multi-select" ||
									selectedProperty.type === "status") &&
									selectedProperty.config?.options && (
										<CommandEmpty>No options found.</CommandEmpty>
									)}
								<FilterValueSelector
									property={selectedProperty}
									value={inputValue}
									onSelect={(value) => handleFilterAdd(selectedProperty, value)}
								/>
							</>
						) : (
							<>
								<CommandEmpty>No fields found.</CommandEmpty>
								<CommandGroup>
									{properties.map((property) => (
										<CommandItem
											key={property.id}
											value={property.id}
											onSelect={() => {
												setSelectedProperty(property);
												setInputValue("");
												requestAnimationFrame(() => {
													inputRef.current?.focus();
												});
											}}
										>
											<span className="truncate">
												{property.label ?? property.id}
											</span>
										</CommandItem>
									))}
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

interface FilterValueSelectorProps<T> {
	property: DataViewProperty<T>;
	value: string;
	onSelect: (value: string) => void;
}

/**
 * Value selector shown after field is selected
 * Renders different UI based on property type
 */
function FilterValueSelector<T>({
	property,
	value,
	onSelect,
}: FilterValueSelectorProps<T>) {
	const variant = getFilterVariantFromPropertyType(property.type);

	switch (variant) {
		case "boolean":
			return (
				<CommandGroup>
					<CommandItem value="true" onSelect={() => onSelect("true")}>
						True
					</CommandItem>
					<CommandItem value="false" onSelect={() => onSelect("false")}>
						False
					</CommandItem>
				</CommandGroup>
			);

		case "select":
		case "multiSelect": {
			const options: SelectOption[] =
				(property.type === "select" ||
					property.type === "multi-select" ||
					property.type === "status") &&
				property.config?.options
					? property.config.options
					: [];

			return (
				<CommandGroup>
					{options.map((option) => (
						<CommandItem
							key={option.value}
							value={option.value}
							onSelect={() => onSelect(option.value)}
						>
							<span className="truncate">{option.label}</span>
						</CommandItem>
					))}
				</CommandGroup>
			);
		}

		case "date":
		case "dateRange":
			return (
				<Calendar
					mode="single"
					selected={value ? new Date(value) : undefined}
					onSelect={(date) => onSelect(date?.getTime().toString() ?? "")}
				/>
			);

		default: {
			const isEmpty = !value.trim();

			return (
				<CommandGroup>
					<CommandItem
						value={value}
						onSelect={() => onSelect(value)}
						disabled={isEmpty}
					>
						{isEmpty ? (
							<>
								<Text />
								<span>Type to add filter...</span>
							</>
						) : (
							<>
								<BadgeCheck />
								<span className="truncate">Filter by &quot;{value}&quot;</span>
							</>
						)}
					</CommandItem>
				</CommandGroup>
			);
		}
	}
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

export type { FilterAddButtonProps };
