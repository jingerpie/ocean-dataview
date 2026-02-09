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
} from "../../../../../lib/utils";
import { Button } from "../../../button";
import { Calendar } from "../../../calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../../dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../../input-group";
import { Popover, PopoverContent, PopoverTrigger } from "../../../popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../select";

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
  /** Current value (ISO string or timestamp) */
  value: string | number | undefined;
  /** Callback when value changes (receives ISO string) */
  onChange: (value: string) => void;
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

/**
 * Check if a date matches any preset (comparing date-only, ignoring time).
 * Returns the matching preset or "custom" if no match.
 */
function getPresetFromDate(date: Date | undefined): DatePreset {
  if (!date) {
    return "custom";
  }

  const dateStr = toDateOnlyString(date);
  const presets: Exclude<DatePreset, "custom">[] = [
    "today",
    "tomorrow",
    "yesterday",
    "one_week_ago",
    "one_week_from_now",
    "one_month_ago",
    "one_month_from_now",
  ];

  for (const preset of presets) {
    const presetDate = getDateFromPreset(preset);
    if (presetDate && toDateOnlyString(presetDate) === dateStr) {
      return preset;
    }
  }

  return "custom";
}

// ============================================================================
// SingleDatePickerContent - For filter chips (input + presets dropdown + calendar)
// ============================================================================

/**
 * Content component for single date picker.
 * Shows an input field (disabled when preset selected) with a dropdown for presets.
 * Calendar is always visible below.
 * Used inside filter chip popover.
 */
function SingleDatePickerContent({ value, onChange }: SingleDatePickerProps) {
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
      <div className="flex w-full p-1 pb-0">
        <InputGroup className={cn(!isValid && "border-destructive")}>
          <InputGroupInput
            disabled={isPresetMode}
            onBlur={handleBlur}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Select or type a date..."
            value={displayValue}
          />
          <InputGroupAddon align="inline-end" className="gap-0">
            {displayValue && (
              <InputGroupButton
                aria-label="Clear date"
                onClick={handleClear}
                size="icon-xs"
                variant="ghost"
              >
                <XIcon />
              </InputGroupButton>
            )}
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
// SingleDatePicker - For advanced filter rules (Select dropdown)
// ============================================================================

/**
 * Full picker component with trigger.
 * Renders as a Select dropdown - used in advanced filter rules.
 *
 * Follows Notion UI pattern:
 * - Preset selected: Shows preset dropdown (Today, Tomorrow, etc.)
 * - Custom date selected: Shows "Custom date" + "Select a date" or "January 15, 2026"
 */
function SingleDatePicker({ value, onChange }: SingleDatePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  // Track preset selection in state (not derived from value)
  // Initialize from value, but user selection takes precedence
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>(() =>
    getPresetFromDate(parseValue(value))
  );

  const dateValue = parseValue(value);
  const displayValue =
    draft ?? (dateValue ? formatDateForDisplay(dateValue) : "");

  const isCustomMode = selectedPreset === "custom";

  const handlePresetChange = (preset: string | null) => {
    if (!preset) {
      return;
    }

    const presetValue = preset as DatePreset;
    setSelectedPreset(presetValue);

    if (presetValue === "custom") {
      // Open calendar for custom date selection
      setCalendarOpen(true);
    } else {
      setCalendarOpen(false);
      const date = getDateFromPreset(presetValue);
      if (date) {
        onChange(toDateOnlyString(date));
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    setDraft(null);
    setIsValid(true);
    onChange(date ? toDateOnlyString(date) : "");
    setCalendarOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    setIsValid(true);
  };

  const handleInputBlur = () => {
    if (!draft) {
      return;
    }

    const parsed = parseDate(draft);
    if (parsed) {
      const formatted = formatDateForDisplay(parsed);
      setDraft(formatted);
      setIsValid(true);
      onChange(toDateOnlyString(parsed));
    } else {
      setIsValid(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleClear = () => {
    setDraft(null);
    setIsValid(true);
    onChange("");
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Preset Select */}
      <Select
        items={DATE_PRESET_ITEMS}
        onValueChange={handlePresetChange}
        value={selectedPreset}
      >
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_PRESET_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date picker button - only when custom mode */}
      {isCustomMode && (
        <Popover onOpenChange={setCalendarOpen} open={calendarOpen}>
          <PopoverTrigger render={<Button size="sm" variant="outline" />}>
            <span>
              {dateValue ? formatDateForDisplay(dateValue) : "Select a date"}
            </span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto gap-0 p-3">
            <InputGroup className={cn(!isValid && "border-destructive")}>
              <InputGroupInput
                onBlur={handleInputBlur}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder="Select or type a date..."
                value={displayValue}
              />
              {displayValue && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton onClick={handleClear} size="icon-sm">
                    <XIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            <Calendar
              mode="single"
              onSelect={handleCalendarSelect}
              selected={dateValue}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export type { SingleDatePickerProps };
export { SingleDatePicker, SingleDatePickerContent };
