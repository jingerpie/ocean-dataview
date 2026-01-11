"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
	ComboboxValue,
} from "@ocean-dataview/dataview/components/ui/combobox";
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
import type {
	FilterCondition,
	FilterOperator,
	FilterVariant,
} from "@ocean-dataview/shared/types";
import {
	getDefaultFilterOperator,
	getFilterOperators,
} from "@ocean-dataview/shared/utils";
import { CalendarIcon, Check } from "lucide-react";
import * as React from "react";
import { Calendar } from "../calendar";
import { LogicConnector } from "./logic-connector";
import { RuleActionsMenu } from "./rule-actions-menu";

interface FilterRuleProps<T> {
	/** The filter condition */
	condition: FilterCondition;
	/** Available properties to filter on */
	properties: DataViewProperty<T>[];
	/** Whether this is the first rule in the group (shows "Where") */
	isFirst: boolean;
	/** Whether this is the second rule in the group (shows dropdown) */
	isSecond: boolean;
	/** Current group logic operator */
	logic: "and" | "or";
	/** Current nesting level */
	level: 0 | 1 | 2;
	/** Callback when condition changes */
	onConditionChange: (condition: FilterCondition) => void;
	/** Callback when group logic changes (affects all rules in group) */
	onLogicChange: (logic: "and" | "or") => void;
	/** Callback to remove this rule */
	onRemove: () => void;
	/** Callback to duplicate this rule */
	onDuplicate: () => void;
	/** Callback to wrap this rule in a group */
	onWrapInGroup: () => void;
	/** Whether this rule can be wrapped in a group */
	canWrapInGroup: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * Maps DataViewProperty type to FilterVariant
 */
function getFilterVariantFromPropertyType(
	type: DataViewProperty<unknown>["type"],
): FilterVariant {
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
		case "multiSelect":
			return "multiSelect";
		case "date":
			return "date";
		case "checkbox":
			return "boolean";
		default:
			return "text";
	}
}

/**
 * Single filter rule row in the filter builder.
 * Contains: LogicConnector, PropertySelector, OperatorSelector, ValueInput, ActionsMenu
 */
// Type for combobox items
interface PropertyComboboxItem {
	id: string;
	label: string;
	type: DataViewProperty<unknown>["type"];
}

export function FilterRule<T>({
	condition,
	properties,
	isFirst,
	isSecond,
	logic,
	level,
	onConditionChange,
	onLogicChange,
	onRemove,
	onDuplicate,
	onWrapInGroup,
	canWrapInGroup,
	className,
}: FilterRuleProps<T>) {
	const [showValueSelector, setShowValueSelector] = React.useState(false);

	// Find the property for this condition
	const property = properties.find((p) => p.id === condition.property);
	const variant = property
		? getFilterVariantFromPropertyType(property.type)
		: "text";
	const operators = getFilterOperators(variant);

	// Transform properties to combobox items format
	const comboboxItems: PropertyComboboxItem[] = properties.map((p) => ({
		id: String(p.id),
		label: (p.label ?? String(p.id)) as string,
		type: p.type,
	}));

	// Find current selected item for combobox
	const selectedPropertyItem = comboboxItems.find(
		(item) => item.id === condition.property,
	);

	// Update helper that maintains type safety
	const updateCondition = (updates: Partial<FilterCondition>) => {
		onConditionChange({ ...condition, ...updates });
	};

	// Handle property selection from combobox
	const handlePropertySelect = (item: PropertyComboboxItem | null) => {
		if (!item) return;
		const propVariant = getFilterVariantFromPropertyType(item.type);
		updateCondition({
			property: item.id,
			operator: getDefaultFilterOperator(propVariant),
			value: undefined,
		});
	};

	return (
		<div className={cn("flex items-center gap-1.5 py-1", className)}>
			{/* Logic Connector */}
			<LogicConnector
				isFirst={isFirst}
				isSecond={isSecond}
				logic={logic}
				onLogicChange={onLogicChange}
			/>

			{/* Property Selector - Combobox with search */}
			<Combobox
				items={comboboxItems}
				value={selectedPropertyItem}
				onValueChange={handlePropertySelect}
			>
				<ComboboxTrigger
					render={<Button variant="outline" size="sm" />}
					className="min-w-28 justify-between"
				>
					<ComboboxValue>
						{selectedPropertyItem?.label ?? "Select property..."}
					</ComboboxValue>
				</ComboboxTrigger>
				<ComboboxContent>
					<ComboboxInput
						showTrigger={false}
						placeholder="Search properties..."
					/>
					<ComboboxEmpty>No properties found.</ComboboxEmpty>
					<ComboboxList>
						{(item: PropertyComboboxItem) => (
							<ComboboxItem key={item.id} value={item}>
								{item.label}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>

			{/* Operator Selector */}
			<Select
				value={condition.operator}
				onValueChange={(value) => {
					if (!value) return;
					updateCondition({
						operator: value as FilterOperator,
						value:
							value === "isEmpty" || value === "isNotEmpty"
								? undefined
								: condition.value,
					});
				}}
			>
				<SelectTrigger size="sm" className="capitalize">
					<SelectValue>
						{operators.find((op) => op.value === condition.operator)?.label ??
							condition.operator}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{operators.map((op) => (
						<SelectItem key={op.value} value={op.value} className="capitalize">
							{op.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{/* Value Input */}
			{property && (
				<ValueInput
					condition={condition}
					property={property}
					variant={variant}
					onValueChange={(value) => updateCondition({ value })}
					showSelector={showValueSelector}
					onShowSelectorChange={setShowValueSelector}
				/>
			)}

			{/* Actions Menu */}
			<RuleActionsMenu
				level={level}
				canWrapInGroup={canWrapInGroup}
				onRemove={onRemove}
				onDuplicate={onDuplicate}
				onWrapInGroup={onWrapInGroup}
			/>
		</div>
	);
}

// ============================================================================
// Value Input Component
// ============================================================================

interface ValueInputProps<T> {
	condition: FilterCondition;
	property: DataViewProperty<T>;
	variant: FilterVariant;
	onValueChange: (value: unknown) => void;
	showSelector: boolean;
	onShowSelectorChange: (show: boolean) => void;
}

function ValueInput<T>({
	condition,
	property,
	variant,
	onValueChange,
	showSelector,
	onShowSelectorChange,
}: ValueInputProps<T>) {
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
					className="h-8 w-28"
					value={condition.value != null ? String(condition.value) : ""}
					onChange={(e) => onValueChange(e.target.value)}
				/>
			);

		case "boolean":
			return (
				<Select
					value={typeof condition.value === "string" ? condition.value : "true"}
					onValueChange={onValueChange}
				>
					<SelectTrigger size="sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="true">True</SelectItem>
						<SelectItem value="false">False</SelectItem>
					</SelectContent>
				</Select>
			);

		case "select": {
			const options: SelectOption[] =
				property.type === "select" && property.config?.options
					? property.config.options
					: [];

			return (
				<Select
					value={condition.value as string | undefined}
					onValueChange={onValueChange}
				>
					<SelectTrigger size="sm">
						<SelectValue>
							{options.find((opt) => opt.value === condition.value)?.label ??
								"Select..."}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{options.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			);
		}

		case "multiSelect": {
			const options: SelectOption[] =
				property.type === "multiSelect" && property.config?.options
					? property.config.options
					: [];

			const selectedValues = Array.isArray(condition.value)
				? condition.value
				: condition.value
					? [condition.value]
					: [];

			const selectedLabels = options
				.filter((opt) => selectedValues.includes(opt.value))
				.map((opt) => opt.label);

			// MultiSelect needs Popover + Command for multi-selection
			return (
				<Popover open={showSelector} onOpenChange={onShowSelectorChange}>
					<PopoverTrigger render={<Button variant="outline" size="sm" />}>
						<span className="truncate">
							{selectedLabels.length === 0
								? "Select..."
								: selectedLabels.length > 1
									? `${selectedLabels.length} selected`
									: selectedLabels[0]}
						</span>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-48 p-0">
						<Command>
							<CommandInput placeholder="Search..." />
							<CommandList>
								<CommandEmpty>No options found.</CommandEmpty>
								<CommandGroup>
									{options.map((option) => (
										<CommandItem
											key={option.value}
											value={option.value}
											onSelect={() => {
												const newValue = selectedValues.includes(option.value)
													? selectedValues.filter((v) => v !== option.value)
													: [...selectedValues, option.value];
												onValueChange(newValue);
											}}
										>
											<span className="truncate">{option.label}</span>
											<Check
												className={cn(
													"ml-auto size-4",
													selectedValues.includes(option.value)
														? "opacity-100"
														: "opacity-0",
												)}
											/>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			);
		}

		case "date":
		case "dateRange": {
			const dateValue = condition.value
				? new Date(Number(condition.value))
				: undefined;

			const formatDate = (date: Date) =>
				date.toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric",
				});

			// Date picker needs Popover + Calendar
			return (
				<Popover open={showSelector} onOpenChange={onShowSelectorChange}>
					<PopoverTrigger
						render={
							<Button
								variant="outline"
								size="sm"
								className={cn(!condition.value && "text-muted-foreground")}
							/>
						}
					>
						<CalendarIcon className="size-3.5" />
						<span className="truncate">
							{dateValue ? formatDate(dateValue) : "Pick date..."}
						</span>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-auto p-0">
						<Calendar
							mode="single"
							selected={dateValue}
							onSelect={(date) => {
								onValueChange(date?.getTime().toString() ?? "");
							}}
						/>
					</PopoverContent>
				</Popover>
			);
		}

		default:
			return null;
	}
}

export type { FilterRuleProps };
