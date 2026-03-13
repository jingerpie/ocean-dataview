"use client";

import type { PropertyMeta, WhereRule } from "../../../../../types";
import type { DateRangeValue } from "./range-date-picker";
import { RangeDatePicker, RangeDatePickerContent } from "./range-date-picker";
import type { RelativeToTodayValue } from "./relative-date-picker";
import {
  RelativeDatePicker,
  RelativeDatePickerContent,
} from "./relative-date-picker";
import {
  SingleDatePicker,
  SingleDatePickerContent,
} from "./single-date-picker";

// ============================================================================
// Types
// ============================================================================

interface DateFilterValueProps {
  onValueChange: (value: unknown) => void;
  property: PropertyMeta;
  rule: WhereRule;
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

// ============================================================================
// DateValueEditor - Inline editor for SimpleFilterEditor
// ============================================================================

function DateValueEditor({ rule, onValueChange }: DateFilterValueProps) {
  if (rule.condition === "isBetween") {
    return (
      <RangeDatePickerContent
        onChange={onValueChange}
        value={rule.value as DateRangeValue | undefined}
      />
    );
  }

  if (rule.condition === "isRelativeToToday") {
    return (
      <RelativeDatePickerContent
        onChange={onValueChange}
        value={rule.value as RelativeToTodayValue | undefined}
      />
    );
  }

  return (
    <SingleDatePickerContent
      onChange={onValueChange}
      value={rule.value as string | undefined}
    />
  );
}

export { DateAdvanceFilter, DateValueEditor };
export type { DateFilterValueProps };
