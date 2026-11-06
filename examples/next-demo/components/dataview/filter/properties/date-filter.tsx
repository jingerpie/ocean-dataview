"use client";

import type { PropertyMeta, WhereRule } from "@jingerpie/dataview-core";
import type { DateRangeValue } from "@/components/dataview/filter/properties/range-date-picker";
import {
  RangeDatePicker,
  RangeDatePickerContent,
} from "@/components/dataview/filter/properties/range-date-picker";
import type { RelativeToTodayValue } from "@/components/dataview/filter/properties/relative-date-picker";
import {
  RelativeDatePicker,
  RelativeDatePickerContent,
} from "@/components/dataview/filter/properties/relative-date-picker";
import {
  SingleDatePicker,
  SingleDatePickerContent,
} from "@/components/dataview/filter/properties/single-date-picker";

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

export type { DateFilterValueProps };
export { DateAdvanceFilter, DateValueEditor };
