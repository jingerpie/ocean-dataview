"use client";

import type { WhereRule } from "@sparkyidea/shared/types";
import type { PropertyMeta } from "../../../../../types";
import type { DateRangeValue } from "../pickers/range-date-picker";
import {
  RangeDatePicker,
  RangeDatePickerContent,
} from "../pickers/range-date-picker";
import type { RelativeToTodayValue } from "../pickers/relative-date-picker";
import {
  RelativeDatePicker,
  RelativeDatePickerContent,
} from "../pickers/relative-date-picker";
import {
  SingleDatePicker,
  SingleDatePickerContent,
} from "../pickers/single-date-picker";
import { SimpleFilterPopover } from "../simple/simple-filter-popover";

// ============================================================================
// Types
// ============================================================================

interface DateFilterChipProps {
  onAddToAdvanced?: () => void;
  onRemove: () => void;
  onRuleChange: (rule: WhereRule) => void;
  property: PropertyMeta;
  rule: WhereRule;
  variant?: "compact" | "detailed";
}

interface DateFilterValueProps {
  onValueChange: (value: unknown) => void;
  property: PropertyMeta;
  rule: WhereRule;
}

// ============================================================================
// DateSimpleFilter - Chip mode using SimpleFilterPopover
// ============================================================================

function DateSimpleFilter({
  rule,
  property,
  onRuleChange,
  onRemove,
  onAddToAdvanced,
  variant,
}: DateFilterChipProps) {
  const handleValueChange = (value: unknown) => {
    onRuleChange({ ...rule, value });
  };

  // Render value input based on condition
  const renderBody = () => {
    if (rule.condition === "isBetween") {
      return (
        <RangeDatePickerContent
          onChange={handleValueChange}
          value={rule.value as DateRangeValue | undefined}
        />
      );
    }

    if (rule.condition === "isRelativeToToday") {
      return (
        <RelativeDatePickerContent
          onChange={handleValueChange}
          value={rule.value as RelativeToTodayValue | undefined}
        />
      );
    }

    return (
      <SingleDatePickerContent
        onChange={handleValueChange}
        value={rule.value as string | undefined}
      />
    );
  };

  return (
    <SimpleFilterPopover
      onAddToAdvanced={onAddToAdvanced}
      onRemove={onRemove}
      onRuleChange={onRuleChange}
      property={property}
      rule={rule}
      variant={variant}
    >
      {renderBody()}
    </SimpleFilterPopover>
  );
}

// ============================================================================
// DateAdvanceFilter - Row mode (date picker components)
// ============================================================================

function DateAdvanceFilter({ rule, onValueChange }: DateFilterValueProps) {
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

export { DateSimpleFilter, DateAdvanceFilter };
export type { DateFilterChipProps, DateFilterValueProps };
