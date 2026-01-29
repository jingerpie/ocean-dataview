"use client";

import { Calendar } from "@ocean-dataview/dataview/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@ocean-dataview/dataview/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@ocean-dataview/dataview/components/ui/input-group";
import {
  cn,
  formatDateForDisplay,
  parseDate,
  parseValue,
  toDateOnlyString,
} from "@ocean-dataview/dataview/lib/utils";
import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

/** Get the first day of the month for calendar display */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

type DatePreset =
  | "today"
  | "tomorrow"
  | "yesterday"
  | "one_week_ago"
  | "one_week_from_now"
  | "one_month_ago"
  | "one_month_from_now";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "yesterday", label: "Yesterday" },
  { value: "one_week_ago", label: "One week ago" },
  { value: "one_week_from_now", label: "One week from now" },
  { value: "one_month_ago", label: "One month ago" },
  { value: "one_month_from_now", label: "One month from now" },
];

const PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  yesterday: "Yesterday",
  one_week_ago: "One week ago",
  one_week_from_now: "One week from now",
  one_month_ago: "One month ago",
  one_month_from_now: "One month from now",
};

/**
 * SingleDateCalendar props for filter chip UI.
 */
interface SingleDateCalendarProps {
  /** Current value (ISO string or timestamp) */
  value: string | number | undefined;
  /** Callback when value changes (receives date-only string YYYY-MM-DD) */
  onChange: (value: string) => void;
}

function getDateFromPreset(preset: DatePreset): Date {
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
    default:
      return now;
  }
}

/**
 * Calendar component for filter chips.
 * Shows an input field (disabled when preset selected) with a dropdown for presets.
 * Calendar is always visible below.
 */
function SingleDateCalendar({ value, onChange }: SingleDateCalendarProps) {
  const [preset, setPreset] = useState<DatePreset | null>(null);
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

  const handlePresetSelect = (selected: DatePreset | "custom") => {
    if (selected === "custom") {
      setPreset(null);
      setDraft("");
      setIsValid(true);
    } else {
      setPreset(selected);
      setDraft(null);
      setIsValid(true);
      const date = getDateFromPreset(selected);
      setDisplayMonth(getMonthStart(date));
      onChange(toDateOnlyString(date));
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

  const presetMenuContent = (
    <DropdownMenuContent align="start" className="w-auto">
      {DATE_PRESETS.map((presetOption) => (
        <DropdownMenuCheckboxItem
          checked={preset === presetOption.value}
          key={presetOption.value}
          onCheckedChange={() => handlePresetSelect(presetOption.value)}
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
  );

  return (
    <div className="flex flex-col items-center">
      <InputGroup className={cn("h-8", !isValid && "border-destructive")}>
        <InputGroupInput
          className="disabled:opacity-100"
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
            {presetMenuContent}
          </DropdownMenu>
        </InputGroupAddon>
      </InputGroup>

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

export type { SingleDateCalendarProps };
export { SingleDateCalendar };
