"use client";

import { Input } from "@ocean-dataview/dataview/components/ui/input";
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
	getFilterVariantFromPropertyType,
} from "@ocean-dataview/shared/utils";
import * as React from "react";
import { BooleanPicker } from "../properties/boolean-picker";
import { DatePicker } from "../properties/date-picker";
import { SelectPicker } from "../properties/select-picker";
import { FilterPropertyPicker } from "./filter-property-picker";
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
 * Single filter rule row in the filter builder.
 * Contains: LogicConnector, PropertySelector, OperatorSelector, ValueInput, ActionsMenu
 */
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
	const property = properties.find((p) => String(p.id) === condition.property);
	const variant = property
		? getFilterVariantFromPropertyType(property.type)
		: "text";
	const operators = getFilterOperators(variant);

	// Update helper that maintains type safety
	const updateCondition = (updates: Partial<FilterCondition>) => {
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

	return (
		<div className={cn("flex items-center gap-1.5 py-1", className)}>
			{/* Logic Connector */}
			<LogicConnector
				isFirst={isFirst}
				isSecond={isSecond}
				logic={logic}
				onLogicChange={onLogicChange}
			/>

			{/* Property Selector */}
			<FilterPropertyPicker
				properties={properties}
				value={property}
				onSelect={handlePropertySelect}
				variant="selector"
			/>

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
// Filter Value Component (exported for reuse)
// ============================================================================

interface FilterValueProps<T> {
	condition: FilterCondition;
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
	const [showSelector, setShowSelector] = React.useState(false);
	return (
		<ValueInput
			condition={condition}
			property={property}
			variant={variant}
			onValueChange={onValueChange}
			showSelector={showSelector}
			onShowSelectorChange={setShowSelector}
		/>
	);
}

// ============================================================================
// Internal Value Input Component
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

		case "select": {
			const options: SelectOption[] =
				(property.type === "select" || property.type === "status") &&
				property.config?.options
					? property.config.options
					: [];

			const selectedValues = Array.isArray(condition.value)
				? (condition.value as string[])
				: condition.value
					? [condition.value as string]
					: [];

			return (
				<SelectPicker
					options={options}
					value={selectedValues}
					onChange={onValueChange}
					placeholder="Select an option"
					open={showSelector}
					onOpenChange={onShowSelectorChange}
				/>
			);
		}

		case "multiSelect": {
			const options: SelectOption[] =
				property.type === "multiSelect" && property.config?.options
					? property.config.options
					: [];

			const selectedValues = Array.isArray(condition.value)
				? (condition.value as string[])
				: condition.value
					? [condition.value as string]
					: [];

			return (
				<SelectPicker
					options={options}
					value={selectedValues}
					onChange={onValueChange}
					placeholder="Select..."
					open={showSelector}
					onOpenChange={onShowSelectorChange}
				/>
			);
		}

		case "date":
		case "dateRange":
			return (
				<DatePicker
					value={condition.value as string | undefined}
					onChange={onValueChange}
					open={showSelector}
					onOpenChange={onShowSelectorChange}
				/>
			);

		default:
			return null;
	}
}

export type { FilterRuleProps };
