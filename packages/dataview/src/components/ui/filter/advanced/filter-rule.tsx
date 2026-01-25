"use client";

import { Input } from "@ocean-dataview/dataview/components/ui/input";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import type {
	MultiSelectConfig,
	PropertyMeta,
	SelectConfig,
	SelectOption,
} from "@ocean-dataview/dataview/types";
import type {
	FilterCondition,
	FilterVariant,
	WhereRule,
} from "@ocean-dataview/shared/types";
import {
	getDefaultFilterCondition,
	getFilterVariantFromPropertyType,
} from "@ocean-dataview/shared/utils";
import { useDebouncer } from "@tanstack/react-pacer";
import { useEffect, useState } from "react";

const FILTER_INPUT_DEBOUNCE_MS = 150;

// ============================================================================
// Debounced Text Input Component
// ============================================================================

interface DebouncedTextInputProps {
	value: string;
	onChange: (value: string) => void;
	type?: "text" | "number";
	inputMode?: "numeric";
	placeholder?: string;
	className?: string;
}

function DebouncedTextInput({
	value,
	onChange,
	type = "text",
	inputMode,
	placeholder,
	className,
}: DebouncedTextInputProps) {
	const [localValue, setLocalValue] = useState(value);

	// Debounced onChange callback
	const changeDebouncer = useDebouncer(onChange, {
		wait: FILTER_INPUT_DEBOUNCE_MS,
	});

	// Sync local state when prop value changes externally
	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	// Flush on unmount
	useEffect(() => {
		return () => changeDebouncer.flush();
	}, [changeDebouncer]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setLocalValue(newValue);
		changeDebouncer.maybeExecute(newValue);
	};

	const handleBlur = () => {
		changeDebouncer.flush();
	};

	return (
		<Input
			className={className}
			inputMode={inputMode}
			onBlur={handleBlur}
			onChange={handleChange}
			placeholder={placeholder}
			type={type}
			value={localValue}
		/>
	);
}

import { CheckboxPicker } from "../../properties/checkbox-picker";
import {
	type DateRangeValue,
	RangeDatePicker,
	RelativeDatePicker,
	type RelativeToTodayValue,
	SingleDatePicker,
} from "../../properties/date-picker";
import { SelectPicker } from "../../properties/select-picker";
import { ConditionPicker } from "../condition-picker";
import { FilterPropertyPicker } from "../filter-property-picker";
import { FilterActions } from "./filter-actions";
import { LogicPicker } from "./logic-picker";

interface FilterRuleProps {
	/** The filter rule */
	rule: WhereRule;
	/** Available properties to filter on */
	properties: readonly PropertyMeta[];
	/** Whether this is the first rule in the group (shows "Where") */
	isFirst: boolean;
	/** Whether this is the second rule in the group (shows dropdown) */
	isSecond: boolean;
	/** Current group logic */
	logic: "and" | "or";
	/** Callback when rule changes */
	onRuleChange: (rule: WhereRule) => void;
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
 * Contains: LogicPicker, PropertySelector, ConditionPicker, ValueInput, ActionsMenu
 */
export function FilterRule({
	rule,
	properties,
	isFirst,
	isSecond,
	logic,
	onRuleChange,
	onLogicChange,
	onRemove,
	onDuplicate,
	onWrapInGroup,
	canWrapInGroup,
	className,
}: FilterRuleProps) {
	const [showValueSelector, setShowValueSelector] = useState(false);

	// Find the property for this rule
	const property = properties.find((p) => String(p.id) === rule.property);
	const variant = property
		? getFilterVariantFromPropertyType(property.type)
		: "text";

	// Update helper that maintains type safety
	const updateRule = (updates: Partial<WhereRule>) => {
		onRuleChange({ ...rule, ...updates });
	};

	// Handle property selection
	const handlePropertySelect = (newProperty: PropertyMeta) => {
		const propVariant = getFilterVariantFromPropertyType(newProperty.type);
		updateRule({
			property: String(newProperty.id),
			condition: getDefaultFilterCondition(propVariant),
			value: undefined,
		});
	};

	// Handle condition change
	const handleConditionChange = (newCondition: FilterCondition) => {
		updateRule({
			condition: newCondition,
			value:
				newCondition === "isEmpty" || newCondition === "isNotEmpty"
					? undefined
					: rule.value,
		});
	};

	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			{/* Logic Picker */}
			<LogicPicker
				isFirst={isFirst}
				isSecond={isSecond}
				logic={logic}
				onLogicChange={onLogicChange}
			/>

			{/* Property Selector */}
			<FilterPropertyPicker
				advance
				onPropertyChange={handlePropertySelect}
				properties={properties}
				value={property}
				variant="rule"
			/>

			{/* Condition Picker */}
			<ConditionPicker
				condition={rule.condition}
				onConditionChange={handleConditionChange}
				variant={variant}
			/>

			{/* Value Input */}
			{property && (
				<ValueInput
					onShowSelectorChange={setShowValueSelector}
					onValueChange={(value) => updateRule({ value })}
					property={property}
					rule={rule}
					showSelector={showValueSelector}
					variant={variant}
				/>
			)}

			{/* Actions Menu */}
			<FilterActions
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

interface FilterValueProps {
	rule: WhereRule;
	property: PropertyMeta;
	variant: FilterVariant;
	onValueChange: (value: unknown) => void;
}

export function FilterValue({
	rule,
	property,
	variant,
	onValueChange,
}: FilterValueProps) {
	const [showSelector, setShowSelector] = useState(false);
	return (
		<ValueInput
			onShowSelectorChange={setShowSelector}
			onValueChange={onValueChange}
			property={property}
			rule={rule}
			showSelector={showSelector}
			variant={variant}
		/>
	);
}

// ============================================================================
// Internal Value Input Component
// ============================================================================

interface ValueInputProps {
	rule: WhereRule;
	property: PropertyMeta;
	variant: FilterVariant;
	onValueChange: (value: unknown) => void;
	showSelector: boolean;
	onShowSelectorChange: (show: boolean) => void;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Switch statement handling different filter variant types
function ValueInput({
	rule,
	property,
	variant,
	onValueChange,
	showSelector,
	onShowSelectorChange,
}: ValueInputProps) {
	// Empty/Not Empty conditions don't need value input
	if (rule.condition === "isEmpty" || rule.condition === "isNotEmpty") {
		return null;
	}

	switch (variant) {
		case "text":
		case "number":
		case "range":
			return (
				<DebouncedTextInput
					className="h-8"
					inputMode={variant === "text" ? undefined : "numeric"}
					onChange={(value) => onValueChange(value)}
					placeholder="Enter value..."
					type={variant === "text" ? "text" : "number"}
					value={rule.value != null ? String(rule.value) : ""}
				/>
			);

		case "boolean":
			return (
				<CheckboxPicker
					onChange={onValueChange}
					value={rule.value as boolean | undefined}
				/>
			);

		case "select": {
			const selectConfig = property.config as SelectConfig | undefined;
			const options: SelectOption[] = selectConfig?.options ?? [];

			let selectedValues: string[];
			if (Array.isArray(rule.value)) {
				selectedValues = rule.value as string[];
			} else if (rule.value) {
				selectedValues = [rule.value as string];
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
			const multiSelectConfig = property.config as
				| MultiSelectConfig
				| undefined;
			const options: SelectOption[] = multiSelectConfig?.options ?? [];

			let selectedValues: string[];
			if (Array.isArray(rule.value)) {
				selectedValues = rule.value as string[];
			} else if (rule.value) {
				selectedValues = [rule.value as string];
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
			if (rule.condition === "isBetween") {
				return (
					<RangeDatePicker
						onChange={onValueChange}
						value={rule.value as DateRangeValue | undefined}
					/>
				);
			}
			if (rule.condition === "isRelativeToToday") {
				return (
					<RelativeDatePicker
						onChange={onValueChange}
						value={rule.value as RelativeToTodayValue | undefined}
					/>
				);
			}
			return (
				<SingleDatePicker
					onChange={(value) => onValueChange(value)}
					value={rule.value as string | undefined}
				/>
			);

		default:
			return null;
	}
}

export type { FilterRuleProps };
