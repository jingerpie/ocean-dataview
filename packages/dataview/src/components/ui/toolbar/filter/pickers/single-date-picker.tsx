"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { XIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
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

/**
 * SingleDatePicker props shared between filter UI and inline editors.
 */
interface SingleDatePickerProps {
  /** Current value (ISO string or timestamp) */
  value: string | number | undefined;
  /** Callback when value changes (receives ISO string) */
  onChange: (value: string) => void;
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
  const presets: DatePreset[] = [
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
// SingleDatePickerContent - For filter chips (select dropdown + inline calendar)
// ============================================================================

/** Presets without "custom" option for the dropdown */
const DATE_PRESET_OPTIONS = DATE_PRESET_ITEMS.filter(
  (item) => item.value !== "custom"
);

/**
 * Content component for single date picker.
 * Renders select dropdown (presets) + always-visible calendar.
 * Used inside filter chip popover - matches Notion's filter UI pattern.
 */
function SingleDatePickerContent({ value, onChange }: SingleDatePickerProps) {
  const dateValue = parseValue(value);

  const handlePresetChange = (preset: string | null) => {
    if (!preset) {
      return;
    }
    const date = getDateFromPreset(preset as DatePreset);
    if (date) {
      onChange(toDateOnlyString(date));
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date ? toDateOnlyString(date) : "");
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Select dropdown with presets */}
      <Select onValueChange={handlePresetChange}>
        <SelectTrigger>
          <SelectValue>
            {dateValue
              ? formatDateForDisplay(dateValue)
              : "Select or type a date..."}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DATE_PRESET_OPTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Calendar always visible */}
      <Calendar
        mode="single"
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
 * - Custom date selected: Shows "Custom date ▼" + "Select a date ▼" or "January 15, 2026 ▼"
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
