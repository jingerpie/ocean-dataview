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
import { Input } from "@ocean-dataview/dataview/components/ui/input";
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
import type {
	DataViewProperty,
	SelectOption,
} from "@ocean-dataview/dataview/types";
import type { PropertyFilter } from "@ocean-dataview/shared/types";
import { Calendar } from "@ocean-dataview/ui/components/calendar";
import { CalendarIcon, Check } from "lucide-react";

interface FilterValueInputProps<T> {
	filter: PropertyFilter<T>;
	property: DataViewProperty<T>;
	inputId: string;
	onValueChange: (value: string | string[]) => void;
	showValueSelector?: boolean;
	onShowValueSelectorChange?: (show: boolean) => void;
}

/**
 * Renders the appropriate input based on filter variant
 * - text/number → Input
 * - boolean → Select
 * - select/multiSelect → Command popover
 * - date/dateRange → Calendar popover
 */
export function FilterValueInput<T>({
	filter,
	property,
	inputId,
	onValueChange,
	showValueSelector = false,
	onShowValueSelectorChange,
}: FilterValueInputProps<T>) {
	// Empty/Not Empty operators don't need value input
	if (filter.operator === "isEmpty" || filter.operator === "isNotEmpty") {
		return (
			<output
				id={inputId}
				aria-label={`${property.label ?? property.id} filter is ${
					filter.operator === "isEmpty" ? "empty" : "not empty"
				}`}
				aria-live="polite"
				className="h-full w-16 rounded-none border bg-transparent px-1.5 py-0.5 text-muted-foreground dark:bg-input/30"
			/>
		);
	}

	switch (filter.variant) {
		case "text":
		case "number":
		case "range":
			return (
				<TextNumberInput
					filter={filter}
					inputId={inputId}
					onValueChange={onValueChange}
				/>
			);

		case "boolean":
			return (
				<BooleanSelect
					filter={filter}
					inputId={inputId}
					onValueChange={onValueChange}
					open={showValueSelector}
					onOpenChange={onShowValueSelectorChange}
				/>
			);

		case "select":
		case "multiSelect":
			return (
				<SelectInput
					filter={filter}
					property={property}
					inputId={inputId}
					onValueChange={onValueChange}
					open={showValueSelector}
					onOpenChange={onShowValueSelectorChange}
				/>
			);

		case "date":
		case "dateRange":
			return (
				<DateInput
					filter={filter}
					inputId={inputId}
					onValueChange={onValueChange}
					open={showValueSelector}
					onOpenChange={onShowValueSelectorChange}
				/>
			);

		default:
			return null;
	}
}

// Text/Number input component
function TextNumberInput<T>({
	filter,
	inputId,
	onValueChange,
}: {
	filter: PropertyFilter<T>;
	inputId: string;
	onValueChange: (value: string) => void;
}) {
	const isNumber = filter.variant === "number" || filter.variant === "range";

	return (
		<Input
			id={inputId}
			type={isNumber ? "number" : "text"}
			inputMode={isNumber ? "numeric" : undefined}
			placeholder="Enter value..."
			className="h-full w-24 rounded-none px-1.5"
			defaultValue={typeof filter.value === "string" ? filter.value : ""}
			onChange={(event) => onValueChange(event.target.value)}
		/>
	);
}

// Boolean select component
function BooleanSelect<T>({
	filter,
	inputId,
	onValueChange,
	open,
	onOpenChange,
}: {
	filter: PropertyFilter<T>;
	inputId: string;
	onValueChange: (value: string) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const inputListboxId = `${inputId}-listbox`;

	return (
		<Select
			open={open}
			onOpenChange={onOpenChange}
			value={typeof filter.value === "string" ? filter.value : "true"}
			onValueChange={(value) => {
				if (value) onValueChange(value);
			}}
		>
			<SelectTrigger
				id={inputId}
				aria-controls={inputListboxId}
				className="rounded-none bg-transparent px-1.5 py-0.5 [&_svg]:hidden"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent id={inputListboxId}>
				<SelectItem value="true">True</SelectItem>
				<SelectItem value="false">False</SelectItem>
			</SelectContent>
		</Select>
	);
}

// Select/MultiSelect command popover
function SelectInput<T>({
	filter,
	property,
	inputId,
	onValueChange,
	open,
	onOpenChange,
}: {
	filter: PropertyFilter<T>;
	property: DataViewProperty<T>;
	inputId: string;
	onValueChange: (value: string | string[]) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const inputListboxId = `${inputId}-listbox`;

	// Get options from property config
	const options: SelectOption[] =
		(property.type === "select" || property.type === "multi-select") &&
		property.config?.options
			? property.config.options
			: [];

	const selectedValues = Array.isArray(filter.value)
		? filter.value
		: [filter.value].filter(Boolean);

	const selectedOptions = options.filter((option) =>
		selectedValues.includes(option.value),
	);

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger
				render={
					<Button
						id={inputId}
						aria-controls={inputListboxId}
						variant="ghost"
						size="sm"
						className="h-full min-w-16 rounded-none border px-1.5 font-normal dark:bg-input/30"
					/>
				}
			>
				{selectedOptions.length === 0 ? (
					filter.variant === "multiSelect" ? (
						"Select options..."
					) : (
						"Select option..."
					)
				) : (
					<span className="truncate">
						{selectedOptions.length > 1
							? `${selectedOptions.length} selected`
							: selectedOptions[0]?.label}
					</span>
				)}
			</PopoverTrigger>
			<PopoverContent id={inputListboxId} align="start" className="w-48 p-0">
				<Command>
					<CommandInput placeholder="Search options..." />
					<CommandList>
						<CommandEmpty>No options found.</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									onSelect={() => {
										const newValue =
											filter.variant === "multiSelect"
												? selectedValues.includes(option.value)
													? selectedValues.filter((v) => v !== option.value)
													: [...selectedValues, option.value]
												: option.value;
										onValueChange(newValue);
									}}
								>
									<span className="truncate">{option.label}</span>
									{filter.variant === "multiSelect" && (
										<Check
											className={cn(
												"ml-auto",
												selectedValues.includes(option.value)
													? "opacity-100"
													: "opacity-0",
											)}
										/>
									)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

// Date/DateRange calendar popover
function DateInput<T>({
	filter,
	inputId,
	onValueChange,
	open,
	onOpenChange,
}: {
	filter: PropertyFilter<T>;
	inputId: string;
	onValueChange: (value: string | string[]) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const inputListboxId = `${inputId}-listbox`;

	const dateValue = Array.isArray(filter.value)
		? filter.value.filter(Boolean)
		: [filter.value, filter.value].filter(Boolean);

	const formatDate = (date: Date) =>
		date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});

	const displayValue =
		filter.operator === "isBetween" && dateValue.length === 2
			? `${formatDate(new Date(Number(dateValue[0])))} - ${formatDate(
					new Date(Number(dateValue[1])),
				)}`
			: dateValue[0]
				? formatDate(new Date(Number(dateValue[0])))
				: "Pick date...";

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger
				render={
					<Button
						id={inputId}
						aria-controls={inputListboxId}
						variant="ghost"
						size="sm"
						className={cn(
							"h-full rounded-none border px-1.5 font-normal dark:bg-input/30",
							!filter.value && "text-muted-foreground",
						)}
					/>
				}
			>
				<CalendarIcon className="size-3.5" />
				<span className="truncate">{displayValue}</span>
			</PopoverTrigger>
			<PopoverContent id={inputListboxId} align="start" className="w-auto p-0">
				{filter.operator === "isBetween" ? (
					<Calendar
						mode="range"
						selected={
							dateValue.length === 2
								? {
										from: new Date(Number(dateValue[0])),
										to: new Date(Number(dateValue[1])),
									}
								: {
										from: new Date(),
										to: new Date(),
									}
						}
						onSelect={(date) => {
							onValueChange(
								date
									? [
											(date.from?.getTime() ?? "").toString(),
											(date.to?.getTime() ?? "").toString(),
										]
									: [],
							);
						}}
					/>
				) : (
					<Calendar
						mode="single"
						selected={dateValue[0] ? new Date(Number(dateValue[0])) : undefined}
						onSelect={(date) => {
							onValueChange((date?.getTime() ?? "").toString());
						}}
					/>
				)}
			</PopoverContent>
		</Popover>
	);
}

export type { FilterValueInputProps };
