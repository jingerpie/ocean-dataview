"use client";

import { cn } from "../../../lib/utils";
import {
  applyConditionChange,
  createRuleFromProperty,
} from "../../../lib/utils/filter-variant";
import type { FilterCondition, PropertyMeta, WhereRule } from "../../../types";
import { AdvancedFilterActions } from "./advanced-filter-actions";
import { LogicPicker } from "./advanced-filter-logic-picker";
import { AdvancedFilterPicker } from "./advanced-filter-picker";
import { ConditionPicker } from "./condition-picker";
import { CheckboxAdvanceFilter } from "./properties/checkbox-filter";
import { DateAdvanceFilter } from "./properties/date-filter";
import { SelectAdvanceFilter } from "./properties/select-filter";
import { StatusAdvanceFilter } from "./properties/status-filter";
import { TextAdvanceFilter } from "./properties/text-filter";

// ============================================================================
// FilterRule Component
// ============================================================================

interface FilterRuleProps {
  /** Whether this rule can be wrapped in a group */
  canWrapInGroup: boolean;
  /** Additional class names */
  className?: string;
  /** Whether this is the first rule in the group (shows "Where") */
  isFirst: boolean;
  /** Whether this is the second rule in the group (shows dropdown) */
  isSecond: boolean;
  /** Current group logic */
  logic: "and" | "or";
  /** Callback to duplicate this rule */
  onDuplicate: () => void;
  /** Callback when group logic changes (affects all rules in group) */
  onLogicChange: (logic: "and" | "or") => void;
  /** Callback to remove this rule */
  onRemove: () => void;
  /** Callback when rule changes */
  onRuleChange: (rule: WhereRule) => void;
  /** Callback to wrap this rule in a group */
  onWrapInGroup: () => void;
  /** Available properties to filter on */
  properties: readonly PropertyMeta[];
  /** The filter rule */
  rule: WhereRule;
}

/**
 * Single filter rule row in the filter builder.
 * Contains: LogicPicker, PropertySelector, ConditionPicker, ValueInput, ActionsMenu
 */
function FilterRule({
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
      <AdvancedFilterPicker
        onPropertyChange={handlePropertySelect}
        properties={properties}
        value={property}
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
          onValueChange={(value) => updateRule({ value })}
          property={property}
          rule={rule}
        />
      )}

      {/* Actions Menu */}
      <AdvancedFilterActions
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
  onValueChange: (value: unknown) => void;
  property: PropertyMeta;
  rule: WhereRule;
}

function FilterValue({ rule, property, onValueChange }: FilterValueProps) {
  return (
    <ValueInput onValueChange={onValueChange} property={property} rule={rule} />
  );
}

// ============================================================================
// Internal Value Input Component - Dispatcher
// ============================================================================

interface ValueInputProps {
  onValueChange: (value: unknown) => void;
  property: PropertyMeta;
  rule: WhereRule;
}

function ValueInput({ rule, property, onValueChange }: ValueInputProps) {
  // Empty/Not Empty conditions don't need value input
  if (rule.condition === "isEmpty" || rule.condition === "isNotEmpty") {
    return null;
  }

  switch (property.type) {
    case "text":
    case "url":
    case "email":
    case "phone":
    case "number":
      return (
        <TextAdvanceFilter
          onValueChange={onValueChange}
          property={property}
          rule={rule}
        />
      );

    case "checkbox":
      return (
        <CheckboxAdvanceFilter
          onValueChange={onValueChange}
          property={property}
          rule={rule}
        />
      );

    case "select":
    case "multiSelect":
      return (
        <SelectAdvanceFilter
          onValueChange={onValueChange}
          property={property}
          rule={rule}
        />
      );

    case "status":
      return (
        <StatusAdvanceFilter
          onValueChange={onValueChange}
          property={property}
          rule={rule}
        />
      );

    case "date":
      return (
        <DateAdvanceFilter
          onValueChange={onValueChange}
          property={property}
          rule={rule}
        />
      );

    case "filesMedia":
    case "formula":
      // Only support isEmpty/isNotEmpty (handled above)
      return null;

    default:
      return null;
  }
}

export { FilterRule, FilterValue };
export type { FilterRuleProps, FilterValueProps };
