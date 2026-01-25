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
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";

type RelativeDirection = "Past" | "This" | "Next";
type RelativeUnit = "day" | "week" | "month" | "year";

interface RelativeToTodayValue {
  direction: RelativeDirection;
  count: number;
  unit: RelativeUnit;
}

interface RelativeDatePickerProps {
  /** Current value with direction, count, and unit */
  value: RelativeToTodayValue | undefined;
  /** Callback when value changes */
  onChange: (value: RelativeToTodayValue) => void;
}

const directionItems = [
  { label: "Past", value: "Past" },
  { label: "This", value: "This" },
  { label: "Next", value: "Next" },
];

const unitItems = [
  { label: "day", value: "day" },
  { label: "week", value: "week" },
  { label: "month", value: "month" },
  { label: "year", value: "year" },
];

/**
 * Calculate date range for relative date filter.
 * Returns start and end dates for the given direction, count, and unit.
 */
function getRelativeDateRange(
  now: Date,
  direction: RelativeDirection,
  count: number,
  unit: RelativeUnit
): { start: Date; end: Date } {
  // For "This" direction, count is always 1
  const n = direction === "This" ? 1 : count;

  switch (unit) {
    case "day":
      if (direction === "Past") {
        return {
          start: startOfDay(subDays(now, n)),
          end: endOfDay(subDays(now, 1)),
        };
      }
      if (direction === "Next") {
        return {
          start: startOfDay(addDays(now, 1)),
          end: endOfDay(addDays(now, n)),
        };
      }
      // This
      return { start: startOfDay(now), end: endOfDay(now) };

    case "week":
      if (direction === "Past") {
        return {
          start: startOfWeek(subWeeks(now, n)),
          end: endOfWeek(subWeeks(now, 1)),
        };
      }
      if (direction === "Next") {
        return {
          start: startOfWeek(addWeeks(now, 1)),
          end: endOfWeek(addWeeks(now, n)),
        };
      }
      // This
      return { start: startOfWeek(now), end: endOfWeek(now) };

    case "month":
      if (direction === "Past") {
        return {
          start: startOfMonth(subMonths(now, n)),
          end: endOfMonth(subMonths(now, 1)),
        };
      }
      if (direction === "Next") {
        return {
          start: startOfMonth(addMonths(now, 1)),
          end: endOfMonth(addMonths(now, n)),
        };
      }
      // This
      return { start: startOfMonth(now), end: endOfMonth(now) };

    case "year":
      if (direction === "Past") {
        return {
          start: startOfYear(subYears(now, n)),
          end: endOfYear(subYears(now, 1)),
        };
      }
      if (direction === "Next") {
        return {
          start: startOfYear(addYears(now, 1)),
          end: endOfYear(addYears(now, n)),
        };
      }
      // This
      return { start: startOfYear(now), end: endOfYear(now) };

    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

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
  // Default to "This week" if no value
  const direction = value?.direction ?? "This";
  const count = value?.count ?? 1;
  const unit = value?.unit ?? "week";

  // Show count input only for Past/Next (not "This")
  const showCount = direction !== "This";

  // Handle direction change
  const handleDirectionChange = (newDirection: RelativeDirection | null) => {
    if (!newDirection) {
      return;
    }
    onChange({
      direction: newDirection,
      count,
      unit,
    });
  };

  // Handle count change
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = Math.max(1, Number.parseInt(e.target.value, 10) || 1);
    onChange({ direction, count: newCount, unit });
  };

  // Handle unit change
  const handleUnitChange = (newUnit: RelativeUnit | null) => {
    if (!newUnit) {
      return;
    }
    onChange({ direction, count, unit: newUnit });
  };

  return (
    <div className="flex w-full gap-2">
      <Select
        items={directionItems}
        onValueChange={handleDirectionChange}
        value={direction}
      >
        <SelectTrigger className="w-full">
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

      {/* Count input - only show for past/next */}
      {showCount && (
        <Input
          className="w-fit"
          min={1}
          onChange={handleCountChange}
          type="number"
          value={count}
        />
      )}

      <Select items={unitItems} onValueChange={handleUnitChange} value={unit}>
        <SelectTrigger className="w-full">
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
  // Default to "This week" if no value
  const direction = value?.direction ?? "This";
  const count = value?.count ?? 1;
  const unit = value?.unit ?? "week";

  // Calculate date range for calendar display
  const now = new Date();
  const dateRange = getRelativeDateRange(now, direction, count, unit);

  return (
    <div className="flex flex-col items-center gap-2">
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

export type { RelativeDatePickerProps, RelativeToTodayValue };
export { RelativeDatePicker, RelativeDatePickerContent };
