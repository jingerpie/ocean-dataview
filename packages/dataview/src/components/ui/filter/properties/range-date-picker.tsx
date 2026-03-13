"use client";

import { ChevronDownIcon } from "lucide-react";
import { type ChangeEvent, type KeyboardEvent, useState } from "react";
import {
  cn,
  formatDateForDisplay,
  parseDate,
  parseValue,
  toDateOnlyString,
} from "../../../../../lib/utils";
import { Button } from "../../../button";
import { Calendar } from "../../../calendar";
import { Input } from "../../../input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../popover";

/**
 * Date range value as positional array: [from, to]
 * - from: start date (YYYY-MM-DD) or null
 * - to: end date (YYYY-MM-DD) or null
 */
type DateRangeValue = [string | null, string | null];

interface RangeDatePickerProps {
  /** Callback when value changes */
  onChange: (value: DateRangeValue) => void;
  /** Current value as [from, to] array */
  value: DateRangeValue | undefined;
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

  // Parse values to Date (value is [from, to] array)
  const fromDate = parseValue(value?.[0] ?? undefined);
  const toDate = parseValue(value?.[1] ?? undefined);

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
      onChange([toDateOnlyString(parsed), value?.[1] ?? null]);
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
      onChange([value?.[0] ?? null, toDateOnlyString(parsed)]);
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
    onChange([
      range?.from ? toDateOnlyString(range.from) : null,
      range?.to ? toDateOnlyString(range.to) : null,
    ]);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Two inputs side by side */}
      <div className="flex w-full flex-col gap-2 p-1 pb-0">
        <Input
          className={cn(
            "h-8 w-full",
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
            "h-8 w-full",
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

  const fromDate = parseValue(value?.[0] ?? undefined);
  const toDate = parseValue(value?.[1] ?? undefined);
  const hasValue = fromDate || toDate;

  // Format display text
  const displayText = hasValue
    ? `${fromDate ? formatDateForDisplay(fromDate) : "..."} - ${toDate ? formatDateForDisplay(toDate) : "..."}`
    : "Select a range";

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger render={<Button variant="outline" />}>
        <span className={hasValue ? undefined : "text-muted-foreground"}>
          {displayText}
        </span>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <RangeDatePickerContent onChange={onChange} value={value} />
      </PopoverContent>
    </Popover>
  );
}

export type { RangeDatePickerProps, DateRangeValue };
export { RangeDatePicker, RangeDatePickerContent };
