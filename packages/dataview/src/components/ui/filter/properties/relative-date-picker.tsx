"use client";

import {
  getRelativeDateRange,
  type RelativeDirection,
  type RelativeToTodayValue,
  type RelativeUnit,
} from "../../../../lib/utils/relative-date";
import { Calendar } from "../../calendar";
import { Input } from "../../input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../select";

interface RelativeDatePickerProps {
  /** Callback when value changes */
  onChange: (value: RelativeToTodayValue) => void;
  /** Current value as [direction, count, unit] array */
  value: RelativeToTodayValue | undefined;
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
  className?: string;
  onChange: (value: RelativeToTodayValue) => void;
  value: RelativeToTodayValue | undefined;
}

function RelativeDateDropdowns({
  value,
  onChange,
  className,
}: RelativeDateDropdownsProps) {
  // Value is [direction, count, unit]
  const [direction, count, unit] = value ?? ["this", 1, "week"];

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
    <div className={`flex w-full gap-2 ${className ?? ""}`}>
      <Select
        items={directionItems}
        onValueChange={handleDirectionChange}
        value={direction}
      >
        <SelectTrigger className="min-w-22 flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {directionItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
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
        <SelectTrigger className="min-w-22 flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {unitItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
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
  // Value is [direction, count, unit]
  const [direction, count, unit] = value ?? ["this", 1, "week"];

  // Calculate date range for calendar display
  const now = new Date();
  const dateRange = getRelativeDateRange(now, direction, count, unit) ?? {
    start: now,
    end: now,
  };

  return (
    <div className="flex flex-col items-center">
      {/* Dropdowns and count input */}
      <RelativeDateDropdowns
        className="p-1 pb-0"
        onChange={onChange}
        value={value}
      />

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

export type { RelativeToTodayValue } from "../../../../lib/utils/relative-date";
export type { RelativeDatePickerProps };
export { RelativeDatePicker, RelativeDatePickerContent };
