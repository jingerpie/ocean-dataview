"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ChevronDownIcon, XIcon } from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";
import {
  cn,
  formatDateForDisplay,
  parseDate,
  parseValue,
  toDateOnlyString,
} from "../../../../lib/utils";
import { Button } from "../../button";
import { Calendar } from "../../calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../input-group";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover";
import { Separator } from "../../separator";

// ============================================================================
// Shared Types & Constants
// ============================================================================

type DatePreset =
  | "today"
  | "tomorrow"
  | "yesterday"
  | "one_week_ago"
  | "one_week_from_now"
  | "one_month_ago"
  | "one_month_from_now"
  | "custom";

const DATE_PRESET_ITEMS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "yesterday", label: "Yesterday" },
  { value: "one_week_ago", label: "One week ago" },
  { value: "one_week_from_now", label: "One week from now" },
  { value: "one_month_ago", label: "One month ago" },
  { value: "one_month_from_now", label: "One month from now" },
  { value: "custom", label: "Custom date" },
];

/** Preset labels for display in input field */
const PRESET_LABELS: Record<Exclude<DatePreset, "custom">, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  yesterday: "Yesterday",
  one_week_ago: "One week ago",
  one_week_from_now: "One week from now",
  one_month_ago: "One month ago",
  one_month_from_now: "One month from now",
};

/**
 * SingleDatePicker props shared between filter UI and inline editors.
 */
interface SingleDatePickerProps {
  /** Callback when value changes (receives ISO string) */
  onChange: (value: string) => void;
  /** Current value (ISO string or timestamp) */
  value: string | number | undefined;
}

// ============================================================================
// Shared Utilities
// ============================================================================

/** Get the first day of the month for calendar display */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDateFromPreset(preset: DatePreset): Date | null {
  const now = new Date();
  switch (preset) {
    case "today":
      return now;
    case "tomorrow":
      return addDays(now, 1);
    case "yesterday":
      return subDays(now, 1);
    case "one_week_ago":
      return subWeeks(now, 1);
    case "one_week_from_now":
      return addWeeks(now, 1);
    case "one_month_ago":
      return subMonths(now, 1);
    case "one_month_from_now":
      return addMonths(now, 1);
    case "custom":
      return null;
    default:
      return null;
  }
}

// ============================================================================
// Shared Body Component (input + dropdown + calendar)
// ============================================================================

interface SingleDatePickerBodyProps extends SingleDatePickerProps {
  autoFocus?: boolean;
  className?: string;
}

/**
 * Shared body component with input, preset dropdown, and calendar.
 * Used by both simple chip popover and advanced filter popover.
 */
function SingleDatePickerBody({
  value,
  onChange,
  className,
}: SingleDatePickerBodyProps) {
  const [preset, setPreset] = useState<Exclude<DatePreset, "custom"> | null>(
    null
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [displayMonth, setDisplayMonth] = useState<Date>(() => new Date());

  const dateValue = parseValue(value);
  const isPresetMode = preset !== null && draft === null;
  const displayValue = isPresetMode
    ? PRESET_LABELS[preset]
    : (draft ?? (dateValue ? formatDateForDisplay(dateValue) : ""));

  // Sync displayMonth when value changes externally
  useEffect(() => {
    if (dateValue) {
      setDisplayMonth(getMonthStart(dateValue));
    }
  }, [dateValue]);

  const handlePresetSelect = (
    selected: Exclude<DatePreset, "custom"> | "custom"
  ) => {
    if (selected === "custom") {
      setPreset(null);
      setDraft("");
      setIsValid(true);
    } else {
      setPreset(selected);
      setDraft(null);
      setIsValid(true);
      const date = getDateFromPreset(selected);
      if (date) {
        setDisplayMonth(getMonthStart(date));
        onChange(toDateOnlyString(date));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setDraft(text);
    setIsValid(true);
    setPreset(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    if (!draft) {
      return;
    }

    const parsed = parseDate(draft);
    if (parsed) {
      const formatted = formatDateForDisplay(parsed);
      setDraft(formatted);
      setIsValid(true);
      setDisplayMonth(getMonthStart(parsed));
      onChange(toDateOnlyString(parsed));
    } else {
      setIsValid(false);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    setPreset(null);
    setDraft(null);
    setIsValid(true);
    if (date) {
      setDisplayMonth(getMonthStart(date));
    }
    onChange(date ? toDateOnlyString(date) : "");
  };

  const handleClear = () => {
    setPreset(null);
    setDraft(null);
    setIsValid(true);
    onChange("");
  };

  /** Presets without "custom" for dropdown */
  const presetOptions = DATE_PRESET_ITEMS.filter(
    (item) => item.value !== "custom"
  ) as { value: Exclude<DatePreset, "custom">; label: string }[];

  return (
    <div className="flex flex-col items-center">
      <div className={cn("flex w-full p-1.5 pb-0.5", className)}>
        <InputGroup className={cn(!isValid && "border-destructive")}>
          <InputGroupInput
            autoFocus={true}
            onBlur={handleBlur}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Select or type a date..."
            readOnly={isPresetMode}
            value={displayValue}
          />
          <InputGroupAddon align="inline-end" className="gap-0">
            {displayValue && !isPresetMode && (
              <InputGroupButton
                aria-label="Clear date"
                onClick={handleClear}
                size="icon-xs"
                variant="ghost"
              >
                <XIcon />
              </InputGroupButton>
            )}
            <Separator orientation="vertical" />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <InputGroupButton
                    aria-label="Select a date"
                    size="icon-xs"
                    variant="ghost"
                  />
                }
              >
                <ChevronDownIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-auto">
                {presetOptions.map((presetOption) => (
                  <DropdownMenuCheckboxItem
                    checked={preset === presetOption.value}
                    key={presetOption.value}
                    onCheckedChange={() =>
                      handlePresetSelect(presetOption.value)
                    }
                  >
                    {presetOption.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuCheckboxItem
                  checked={preset === null && draft !== null}
                  onCheckedChange={() => handlePresetSelect("custom")}
                >
                  Custom date
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <Calendar
        mode="single"
        month={displayMonth}
        onMonthChange={setDisplayMonth}
        onSelect={handleCalendarSelect}
        selected={dateValue}
      />
    </div>
  );
}

// ============================================================================
// SingleDatePickerContent - For filter chips (with padding)
// ============================================================================

/**
 * Content component for single date picker.
 * Shows an input field (disabled when preset selected) with a dropdown for presets.
 * Calendar is always visible below.
 * Used inside filter chip popover.
 */
function SingleDatePickerContent({ value, onChange }: SingleDatePickerProps) {
  return (
    <SingleDatePickerBody
      className="p-1 pb-0"
      onChange={onChange}
      value={value}
    />
  );
}

// ============================================================================
// SingleDatePicker - For advanced filter rules (popover trigger)
// ============================================================================

/**
 * Full picker component with trigger.
 * Renders as a button that opens the picker body in a popover.
 * Used in advanced filter rules.
 */
function SingleDatePicker({ value, onChange }: SingleDatePickerProps) {
  const [open, setOpen] = useState(false);
  const dateValue = parseValue(value);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger render={<Button variant="outline" />}>
        <span className={dateValue ? undefined : "text-muted-foreground"}>
          {dateValue ? formatDateForDisplay(dateValue) : "Select a date"}
        </span>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <SingleDatePickerBody onChange={onChange} value={value} />
      </PopoverContent>
    </Popover>
  );
}

export type { SingleDatePickerProps };
export { SingleDatePicker, SingleDatePickerContent };
