"use client";

import { Input } from "@ocean-dataview/dataview/components/ui/input";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type {
	DataViewProperty,
	SelectOption,
} from "@ocean-dataview/dataview/types";
import type {
	FilterOperator,
	FilterVariant,
	WhereCondition,
} from "@ocean-dataview/shared/types";
import {
	getDefaultFilterOperator,
	getFilterVariantFromPropertyType,
} from "@ocean-dataview/shared/utils";
import { useState } from "react";
import { CheckboxPicker } from "../../properties/checkbox-picker";
import {
	type DateRangeValue,
	RangeDatePicker,
	RelativeDatePicker,
	type RelativeToTodayValue,
	SingleDatePicker,
} from "../../properties/date-picker";
import { SelectPicker } from "../../properties/select-picker";
import { FilterPropertyPicker } from "../filter-property-picker";
import { OperatorPicker } from "../operator-picker";
import { FilterActionsMenu } from "./filter-actions-menu";
import { LogicalOperator } from "./logical-operator";

interface FilterRuleProps<T> {
	/** The filter condition */
	condition: WhereCondition;
	/** Available properties to filter on */
	properties: DataViewProperty<T>[];
	/** Whether this is the first rule in the group (shows "Where") */
	isFirst: boolean;
	/** Whether this is the second rule in the group (shows dropdown) */
	isSecond: boolean;
	/** Current group logic operator */
	logic: "and" | "or";
	/** Callback when condition changes */
	onConditionChange: (condition: WhereCondition) => void;
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
 * Single filter rule row in the filter builder.
 * Contains: LogicalOperator, PropertySelector, OperatorSelector, ValueInput, ActionsMenu
 */
export function FilterRule<T>({
	condition,
	properties,
	isFirst,
	isSecond,
	logic,
	onConditionChange,
	onLogicChange,
	onRemove,
	onDuplicate,
	onWrapInGroup,
	canWrapInGroup,
	className,
}: FilterRuleProps<T>) {
	const [showValueSelector, setShowValueSelector] = useState(false);

	// Find the property for this condition
	const property = properties.find((p) => String(p.id) === condition.property);
	const variant = property
		? getFilterVariantFromPropertyType(property.type)
		: "text";

	// Update helper that maintains type safety
	const updateCondition = (updates: Partial<WhereCondition>) => {
		onConditionChange({ ...condition, ...updates });
	};

	// Handle property selection
	const handlePropertySelect = (newProperty: DataViewProperty<T>) => {
		const propVariant = getFilterVariantFromPropertyType(newProperty.type);
		updateCondition({
			property: String(newProperty.id),
			operator: getDefaultFilterOperator(propVariant),
			value: undefined,
		});
	};

	// Handle operator change
	const handleOperatorChange = (operator: FilterOperator) => {
		updateCondition({
			operator,
			value:
				operator === "isEmpty" || operator === "isNotEmpty"
					? undefined
					: condition.value,
		});
	};

	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			{/* Logical Operator */}
			<LogicalOperator
				isFirst={isFirst}
				isSecond={isSecond}
				logic={logic}
				onLogicChange={onLogicChange}
			/>

			{/* Property Selector */}
			<FilterPropertyPicker
				advance
				onSelect={handlePropertySelect}
				properties={properties}
				value={property}
				variant="rule"
			/>

			{/* Operator Picker */}
			<OperatorPicker
				onChange={handleOperatorChange}
				value={condition.operator}
				variant={variant}
			/>

			{/* Value Input */}
			{property && (
				<ValueInput
					condition={condition}
					onShowSelectorChange={setShowValueSelector}
					onValueChange={(value) => updateCondition({ value })}
					property={property}
					showSelector={showValueSelector}
					variant={variant}
				/>
			)}

			{/* Actions Menu */}
			<FilterActionsMenu
				onDuplicate={onDuplicate}
				onRemove={onRemove}
				onWrapInGroup={canWrapInGroup ? onWrapInGroup : undefined}
			/>
		</div>
	);
}

// ============================================================================
// Filter Value Component (exported for reuse)
// ============================================================================

interface FilterValueProps<T> {
	condition: WhereCondition;
	property: DataViewProperty<T>;
	variant: FilterVariant;
	onValueChange: (value: unknown) => void;
}

export function FilterValue<T>({
	condition,
	property,
	variant,
	onValueChange,
}: FilterValueProps<T>) {
	const [showSelector, setShowSelector] = useState(false);
	return (
		<ValueInput
			condition={condition}
			onShowSelectorChange={setShowSelector}
			onValueChange={onValueChange}
			property={property}
			showSelector={showSelector}
			variant={variant}
		/>
	);
}

// ============================================================================
// Internal Value Input Component
// ============================================================================

interface ValueInputProps<T> {
	condition: WhereCondition;
	property: DataViewProperty<T>;
	variant: FilterVariant;
	onValueChange: (value: unknown) => void;
	showSelector: boolean;
	onShowSelectorChange: (show: boolean) => void;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Switch statement handling different filter variant types
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
					className="h-8"
					inputMode={variant === "text" ? undefined : "numeric"}
					onChange={(e) => onValueChange(e.target.value)}
					placeholder="Enter value..."
					type={variant === "text" ? "text" : "number"}
					value={condition.value != null ? String(condition.value) : ""}
				/>
			);

		case "boolean":
			return (
				<CheckboxPicker
					onChange={onValueChange}
					value={condition.value as boolean | undefined}
				/>
			);

		case "select": {
			const options: SelectOption[] =
				(property.type === "select" || property.type === "status") &&
				property.config?.options
					? property.config.options
					: [];

			let selectedValues: string[];
			if (Array.isArray(condition.value)) {
				selectedValues = condition.value as string[];
			} else if (condition.value) {
				selectedValues = [condition.value as string];
			} else {
				selectedValues = [];
			}

			return (
				<SelectPicker
					onChange={onValueChange}
					onOpenChange={onShowSelectorChange}
					open={showSelector}
					options={options}
					placeholder="Select an option"
					value={selectedValues}
				/>
			);
		}

		case "multiSelect": {
			const options: SelectOption[] =
				property.type === "multiSelect" && property.config?.options
					? property.config.options
					: [];

			let selectedValues: string[];
			if (Array.isArray(condition.value)) {
				selectedValues = condition.value as string[];
			} else if (condition.value) {
				selectedValues = [condition.value as string];
			} else {
				selectedValues = [];
			}

			return (
				<SelectPicker
					onChange={onValueChange}
					onOpenChange={onShowSelectorChange}
					open={showSelector}
					options={options}
					placeholder="Select..."
					value={selectedValues}
				/>
			);
		}

		case "date":
		case "dateRange":
			if (condition.operator === "isBetween") {
				return (
					<RangeDatePicker
						onChange={onValueChange}
						value={condition.value as DateRangeValue | undefined}
					/>
				);
			}
			if (condition.operator === "isRelativeToToday") {
				return (
					<RelativeDatePicker
						onChange={onValueChange}
						value={condition.value as RelativeToTodayValue | undefined}
					/>
				);
			}
			return (
				<SingleDatePicker
					onChange={(value) => onValueChange(value)}
					value={condition.value as string | undefined}
				/>
			);

		default:
			return null;
	}
}

export type { FilterRuleProps };
