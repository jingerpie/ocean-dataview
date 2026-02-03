"use client";

import type { FilterCondition, WhereRule } from "@sparkyidea/shared/types";
import {
  applyConditionChange,
  createRuleFromProperty,
  extractSelectValues,
} from "@sparkyidea/shared/utils";
import { useDebouncer } from "@tanstack/react-pacer";
import { useEffect, useState } from "react";
import { cn } from "../../../../../lib/utils";
import type {
  MultiSelectConfig,
  PropertyMeta,
  SelectConfig,
  SelectOption,
  StatusConfig,
} from "../../../../../types";
import { Input } from "../../../input";

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

import { CheckboxPicker } from "../pickers/checkbox-picker";
import { ConditionPicker } from "../pickers/condition-picker";
import { FilterPropertyPicker } from "../pickers/filter-property-picker";
import { LogicPicker } from "../pickers/logic-picker";
import type { DateRangeValue } from "../pickers/range-date-picker";
import { RangeDatePicker } from "../pickers/range-date-picker";
import type { RelativeToTodayValue } from "../pickers/relative-date-picker";
import { RelativeDatePicker } from "../pickers/relative-date-picker";
import { SelectPicker } from "../pickers/select-picker";
import { SingleDatePicker } from "../pickers/single-date-picker";
import { StatusPicker } from "../pickers/status-picker";
import { FilterActions } from "./filter-actions";

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

  // Update helper that maintains type safety
  const updateRule = (updates: Partial<WhereRule>) => {
    onRuleChange({ ...rule, ...updates });
  };

  // Handle property selection
  const handlePropertySelect = (newProperty: PropertyMeta) => {
    onRuleChange(createRuleFromProperty(newProperty));
  };

  // Handle condition change
  const handleConditionChange = (newCondition: FilterCondition) => {
    onRuleChange(applyConditionChange(rule, newCondition));
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
      {property && (
        <ConditionPicker
          condition={rule.condition}
          onConditionChange={handleConditionChange}
          propertyType={property.type}
        />
      )}

      {/* Value Input */}
      {property && (
        <ValueInput
          onShowSelectorChange={setShowValueSelector}
          onValueChange={(value) => updateRule({ value })}
          property={property}
          rule={rule}
          showSelector={showValueSelector}
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
  onValueChange: (value: unknown) => void;
}

export function FilterValue({
  rule,
  property,
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
    />
  );
}

// ============================================================================
// Internal Value Input Component
// ============================================================================

interface ValueInputProps {
  rule: WhereRule;
  property: PropertyMeta;
  onValueChange: (value: unknown) => void;
  showSelector: boolean;
  onShowSelectorChange: (show: boolean) => void;
}

function ValueInput({
  rule,
  property,
  onValueChange,
  showSelector,
  onShowSelectorChange,
}: ValueInputProps) {
  // Empty/Not Empty conditions don't need value input
  if (rule.condition === "isEmpty" || rule.condition === "isNotEmpty") {
    return null;
  }

  switch (property.type) {
    case "text":
    case "url":
    case "email":
    case "phone":
      return (
        <DebouncedTextInput
          className="h-8"
          onChange={(value) => onValueChange(value)}
          placeholder="Enter value..."
          type="text"
          value={rule.value != null ? String(rule.value) : ""}
        />
      );

    case "number":
      return (
        <DebouncedTextInput
          className="h-8"
          inputMode="numeric"
          onChange={(value) => onValueChange(value)}
          placeholder="Enter value..."
          type="number"
          value={rule.value != null ? String(rule.value) : ""}
        />
      );

    case "checkbox":
      return (
        <CheckboxPicker
          onChange={onValueChange}
          value={rule.value as boolean | undefined}
        />
      );

    case "select": {
      const config = property.config as SelectConfig | undefined;
      const options: SelectOption[] = config?.options ?? [];

      return (
        <SelectPicker
          onChange={onValueChange}
          onOpenChange={onShowSelectorChange}
          open={showSelector}
          options={options}
          placeholder="Select an option"
          value={extractSelectValues(rule.value)}
        />
      );
    }

    case "multiSelect": {
      const config = property.config as MultiSelectConfig | undefined;
      const options: SelectOption[] = config?.options ?? [];

      return (
        <SelectPicker
          onChange={onValueChange}
          onOpenChange={onShowSelectorChange}
          open={showSelector}
          options={options}
          placeholder="Select..."
          value={extractSelectValues(rule.value)}
        />
      );
    }

    case "status": {
      const config = property.config as StatusConfig | undefined;
      return (
        <StatusPicker
          config={config ?? { groups: [] }}
          onValueChange={onValueChange}
          value={extractSelectValues(rule.value)}
        />
      );
    }

    case "date": {
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
    }

    case "filesMedia":
    case "formula":
      // Only support isEmpty/isNotEmpty (handled above)
      return null;

    default:
      return null;
  }
}

export type { FilterRuleProps };
