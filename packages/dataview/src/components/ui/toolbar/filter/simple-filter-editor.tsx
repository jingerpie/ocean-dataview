"use client";

import type { FilterCondition, WhereRule } from "@sparkyidea/shared/types";
import { applyConditionChange } from "@sparkyidea/shared/utils";
import type { PropertyMeta } from "../../../../types";
import { ConditionPicker } from "./condition-picker";
import { CheckboxValueEditor } from "./properties/checkbox-filter";
import { DateValueEditor } from "./properties/date-filter";
import { SelectValueEditor } from "./properties/select-filter";
import { StatusValueEditor } from "./properties/status-filter";
import { TextValueEditor } from "./properties/text-filter";
import { FilterActions } from "./simple-filter-actions";

interface SimpleFilterEditorProps {
  /** Callback to add this filter to advanced filter */
  onAddToAdvanced?: () => void;
  /** Callback when popover should close */
  onClose?: () => void;
  /** Callback to remove this filter */
  onRemove: () => void;
  /** Callback when rule changes */
  onRuleChange: (rule: WhereRule) => void;
  /** The property being filtered */
  property: PropertyMeta;
  /** The filter rule */
  rule: WhereRule;
}

/**
 * Simple filter editor - popover content for editing a single filter rule.
 *
 * Structure:
 * - Header: Property label + Condition picker + Actions menu
 * - Body: Value input (dispatched by property type)
 *
 * Used inside SimpleFilterChip's popover content.
 */
function SimpleFilterEditor({
  rule,
  property,
  onRuleChange,
  onRemove,
  onAddToAdvanced,
  onClose,
}: SimpleFilterEditorProps) {
  const label = property.label ?? String(property.id);

  const handleConditionChange = (newCondition: FilterCondition) => {
    onRuleChange(applyConditionChange(rule, newCondition, property.type));
  };

  const handleValueChange = (value: unknown) => {
    onRuleChange({ ...rule, value });
  };

  const handleRemove = () => {
    onRemove();
    onClose?.();
  };

  const handleAddToAdvanced = onAddToAdvanced
    ? () => {
        onAddToAdvanced();
        onClose?.();
      }
    : undefined;

  // Check if value input should be hidden (isEmpty/isNotEmpty conditions)
  const hideValueInput =
    rule.condition === "isEmpty" || rule.condition === "isNotEmpty";

  return (
    <div className="flex flex-col gap-1">
      {/* Header: Property + Condition + Actions */}
      <div className="flex items-center justify-between px-1">
        <div className="flex min-w-0 items-center pl-1">
          <span className="max-w-24 truncate font-medium text-muted-foreground text-xs">
            {label}
          </span>
          <ConditionPicker
            className="p-1 font-semibold text-xs"
            condition={rule.condition}
            inline
            onConditionChange={handleConditionChange}
            propertyType={property.type}
          />
        </div>
        <FilterActions
          onAddToAdvanced={handleAddToAdvanced}
          onRemove={handleRemove}
        />
      </div>

      {/* Value Input (dispatched by property type) */}
      {!hideValueInput && (
        <ValueEditor
          onValueChange={handleValueChange}
          property={property}
          rule={rule}
        />
      )}
    </div>
  );
}

// ============================================================================
// Value Editor Dispatcher
// ============================================================================

interface ValueEditorProps {
  onValueChange: (value: unknown) => void;
  property: PropertyMeta;
  rule: WhereRule;
}

function ValueEditor({ rule, property, onValueChange }: ValueEditorProps) {
  switch (property.type) {
    case "text":
    case "url":
    case "email":
    case "phone":
    case "number":
      return (
        <TextValueEditor
          onValueChange={onValueChange}
          property={property}
          rule={rule}
        />
      );

    case "checkbox":
      return (
        <CheckboxValueEditor
          onValueChange={onValueChange}
          property={property}
          rule={rule}
        />
      );

    case "select":
    case "multiSelect":
      return (
        <SelectValueEditor
          onValueChange={onValueChange}
          property={property}
          rule={rule}
        />
      );

    case "status":
      return (
        <StatusValueEditor
          onValueChange={onValueChange}
          property={property}
          rule={rule}
        />
      );

    case "date":
      return (
        <DateValueEditor
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

export { SimpleFilterEditor, type SimpleFilterEditorProps };
