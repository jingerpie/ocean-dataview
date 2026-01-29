"use client";

import { Calendar } from "@ocean-dataview/dataview/components/ui/calendar";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";
import {
  getRelativeDateRange,
  type RelativeDirection,
  type RelativeToTodayValue,
  type RelativeUnit,
} from "@ocean-dataview/shared/utils";

interface RelativeDatePickerProps {
  /** Current value as [direction, count, unit] array */
  value: RelativeToTodayValue | undefined;
  /** Callback when value changes */
  onChange: (value: RelativeToTodayValue) => void;
}

const directionItems = [
  { label: "Past", value: "past" },
  { label: "This", value: "this" },
  { label: "Next", value: "next" },
];

const unitItems = [
  { label: "day", value: "day" },
  { label: "week", value: "week" },
  { label: "month", value: "month" },
  { label: "year", value: "year" },
];

// ============================================================================
// Shared dropdowns component
// ============================================================================

interface RelativeDateDropdownsProps {
  value: RelativeToTodayValue | undefined;
  onChange: (value: RelativeToTodayValue) => void;
}

function RelativeDateDropdowns({
  value,
  onChange,
}: RelativeDateDropdownsProps) {
  // Default to "this week" if no value (value is [direction, count, unit])
  const direction = value?.[0] ?? "this";
  const count = value?.[1] ?? 1;
  const unit = value?.[2] ?? "week";

  // Show count input only for past/next (not "this")
  const showCount = direction !== "this";

  // Handle direction change
  const handleDirectionChange = (newDirection: RelativeDirection | null) => {
    if (!newDirection) {
      return;
    }
    onChange([newDirection, count, unit]);
  };

  // Handle count change
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = Math.max(1, Number.parseInt(e.target.value, 10) || 1);
    onChange([direction, newCount, unit]);
  };

  // Handle unit change
  const handleUnitChange = (newUnit: RelativeUnit | null) => {
    if (!newUnit) {
      return;
    }
    onChange([direction, count, newUnit]);
  };

  return (
    <div className="flex w-full gap-2">
      <Select
        items={directionItems}
        onValueChange={handleDirectionChange}
        value={direction}
      >
        <SelectTrigger className="w-0 flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {directionItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Count input - only show for past/next, fixed width */}
      {showCount && (
        <Input
          className="w-16"
          min={1}
          onChange={handleCountChange}
          type="number"
          value={count}
        />
      )}

      <Select items={unitItems} onValueChange={handleUnitChange} value={unit}>
        <SelectTrigger className="w-0 flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {unitItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================================================
// RelativeDatePickerContent - For filter chips (dropdowns + readonly calendar)
// ============================================================================

/**
 * Content component for relative date picker.
 * Renders as dropdowns + readonly calendar - used inside filter chip popover.
 */
function RelativeDatePickerContent({
  value,
  onChange,
}: RelativeDatePickerProps) {
  // Default to "this week" if no value (value is [direction, count, unit])
  const direction = value?.[0] ?? "this";
  const count = value?.[1] ?? 1;
  const unit = value?.[2] ?? "week";

  // Calculate date range for calendar display
  const now = new Date();
  const dateRange = getRelativeDateRange(now, direction, count, unit) ?? {
    start: now,
    end: now,
  };

  return (
    <div className="flex flex-col items-center">
      {/* Dropdowns and count input */}
      <RelativeDateDropdowns onChange={onChange} value={value} />

      {/* Calendar - display only, shows computed range */}
      {/* Key forces re-mount when range changes to update displayed month */}
      {/* Using defaultMonth instead of month to allow navigation with < > buttons */}
      <Calendar
        defaultMonth={dateRange.start}
        key={`${direction}-${count}-${unit}`}
        mode="range"
        readOnly
        selected={{ from: dateRange.start, to: dateRange.end }}
      />
    </div>
  );
}

// ============================================================================
// RelativeDatePicker - For advanced filter rules (inline dropdowns only)
// ============================================================================

/**
 * Full picker component without popover.
 * Renders as inline dropdowns only (no calendar) - used in advanced filter rules.
 */
function RelativeDatePicker({ value, onChange }: RelativeDatePickerProps) {
  return <RelativeDateDropdowns onChange={onChange} value={value} />;
}

export type { RelativeDatePickerProps };
export type { RelativeToTodayValue } from "@ocean-dataview/shared/utils";
export { RelativeDatePicker, RelativeDatePickerContent };
