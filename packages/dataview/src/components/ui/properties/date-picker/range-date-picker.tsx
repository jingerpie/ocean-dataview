"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { Calendar } from "@ocean-dataview/dataview/components/ui/calendar";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import {
  cn,
  formatDateForDisplay,
  parseDate,
  parseValue,
} from "@ocean-dataview/dataview/lib/utils";
import { CalendarIcon } from "lucide-react";
import { type ChangeEvent, type KeyboardEvent, useState } from "react";

interface DateRangeValue {
  from?: string;
  to?: string;
}

interface RangeDatePickerProps {
  /** Current value with from/to dates */
  value: DateRangeValue | undefined;
  /** Callback when value changes */
  onChange: (value: DateRangeValue) => void;
}

// ============================================================================
// RangeDatePickerContent - For filter chips (inputs + calendar)
// ============================================================================

/**
 * Content component for range date picker.
 * Renders as inputs + calendar - used inside filter chip popover.
 */
function RangeDatePickerContent({ value, onChange }: RangeDatePickerProps) {
  // Draft state for inputs
  const [fromDraft, setFromDraft] = useState<string | null>(null);
  const [toDraft, setToDraft] = useState<string | null>(null);
  const [fromValid, setFromValid] = useState(true);
  const [toValid, setToValid] = useState(true);

  // Parse values to Date
  const fromDate = parseValue(value?.from);
  const toDate = parseValue(value?.to);

  // Display values
  const fromDisplay =
    fromDraft ?? (fromDate ? formatDateForDisplay(fromDate) : "");
  const toDisplay = toDraft ?? (toDate ? formatDateForDisplay(toDate) : "");

  // Handle from input change
  const handleFromChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFromDraft(e.target.value);
    setFromValid(true);
  };

  // Handle to input change
  const handleToChange = (e: ChangeEvent<HTMLInputElement>) => {
    setToDraft(e.target.value);
    setToValid(true);
  };

  // Handle from input blur
  const handleFromBlur = () => {
    if (!fromDraft) {
      return;
    }

    const parsed = parseDate(fromDraft);
    if (parsed) {
      const formatted = formatDateForDisplay(parsed);
      setFromDraft(formatted);
      setFromValid(true);
      onChange({ ...value, from: parsed.toISOString() });
    } else {
      setFromValid(false);
    }
  };

  // Handle to input blur
  const handleToBlur = () => {
    if (!toDraft) {
      return;
    }

    const parsed = parseDate(toDraft);
    if (parsed) {
      const formatted = formatDateForDisplay(parsed);
      setToDraft(formatted);
      setToValid(true);
      onChange({ ...value, to: parsed.toISOString() });
    } else {
      setToValid(false);
    }
  };

  // Handle Enter key
  const handleFromKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleToKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  // Handle calendar range selection
  const handleRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    setFromDraft(null);
    setToDraft(null);
    setFromValid(true);
    setToValid(true);
    onChange({
      from: range?.from?.toISOString(),
      to: range?.to?.toISOString(),
    });
  };

  return (
    <div className="flex flex-col items-center">
      {/* Two inputs side by side */}
      <div className="flex gap-2">
        <Input
          className={cn(
            !fromValid && "border-destructive focus-visible:ring-destructive"
          )}
          onBlur={handleFromBlur}
          onChange={handleFromChange}
          onKeyDown={handleFromKeyDown}
          placeholder="Starting"
          type="text"
          value={fromDisplay}
        />
        <Input
          className={cn(
            !toValid && "border-destructive focus-visible:ring-destructive"
          )}
          onBlur={handleToBlur}
          onChange={handleToChange}
          onKeyDown={handleToKeyDown}
          placeholder="Ending"
          type="text"
          value={toDisplay}
        />
      </div>

      {/* Range calendar */}
      <Calendar
        mode="range"
        onSelect={handleRangeSelect}
        selected={{ from: fromDate, to: toDate }}
      />
    </div>
  );
}

// ============================================================================
// RangeDatePicker - For advanced filter rules (Button trigger + Popover)
// ============================================================================

/**
 * Full picker component with trigger.
 * Renders as Button trigger → Popover with content - used in advanced filter rules.
 */
function RangeDatePicker({ value, onChange }: RangeDatePickerProps) {
  const [open, setOpen] = useState(false);

  const fromDate = parseValue(value?.from);
  const toDate = parseValue(value?.to);

  // Format display text
  const displayText =
    fromDate || toDate
      ? `${fromDate ? formatDateForDisplay(fromDate) : "..."} - ${toDate ? formatDateForDisplay(toDate) : "..."}`
      : "Select a range";

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger render={<Button size="sm" variant="outline" />}>
        <CalendarIcon className="mr-2 size-4" />
        <span>{displayText}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <RangeDatePickerContent onChange={onChange} value={value} />
      </PopoverContent>
    </Popover>
  );
}

export type { RangeDatePickerProps, DateRangeValue };
export { RangeDatePicker, RangeDatePickerContent };
