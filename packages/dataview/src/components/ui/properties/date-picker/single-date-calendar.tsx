"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { Calendar } from "@ocean-dataview/dataview/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
} from "@ocean-dataview/dataview/lib/utils";
import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { useState } from "react";

type DatePickerMode = "selector" | "input";
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
  /** Callback when value changes (receives ISO string) */
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

function getMode(
  preset: DatePreset | null,
  draft: string | null
): DatePickerMode {
  if (preset && draft === null) {
    return "selector";
  }
  return "input";
}

/**
 * Calendar component for filter chips with two UI modes:
 * - Selector mode: Shows preset label, acts as dropdown trigger
 * - Input mode: Shows editable text input with clear and dropdown buttons (default)
 *
 * Calendar is always visible below.
 */
function SingleDateCalendar({ value, onChange }: SingleDateCalendarProps) {
  const [preset, setPreset] = useState<DatePreset | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  const dateValue = parseValue(value);
  const displayValue =
    draft ?? (dateValue ? formatDateForDisplay(dateValue) : "");
  const mode = getMode(preset, draft);

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
      onChange(date.toISOString());
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
      onChange(parsed.toISOString());
    } else {
      setIsValid(false);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    setPreset(null);
    setDraft(null);
    setIsValid(true);
    onChange(date?.toISOString() ?? "");
  };

  const handleClear = () => {
    setPreset(null);
    setDraft(null);
    setIsValid(true);
    onChange("");
  };

  const presetMenuContent = (
    <DropdownMenuContent align="start" className="w-48">
      {DATE_PRESETS.map((presetOption) => (
        <DropdownMenuItem
          key={presetOption.value}
          onClick={() => handlePresetSelect(presetOption.value)}
        >
          <span className="flex-1">{presetOption.label}</span>
          {preset === presetOption.value && <CheckIcon className="size-4" />}
        </DropdownMenuItem>
      ))}
      <DropdownMenuItem onClick={() => handlePresetSelect("custom")}>
        <span className="flex-1">Custom date</span>
        {preset === null && draft !== null && <CheckIcon className="size-4" />}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <div className="flex flex-col items-center">
      {!isValid && (
        <span className="mb-1 text-destructive text-sm">Invalid date</span>
      )}

      {mode === "input" ? (
        <InputGroup className={cn(!isValid && "border-destructive")}>
          <InputGroupInput
            onBlur={handleBlur}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Select or type a date..."
            value={displayValue}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton onClick={handleClear} size="icon-sm">
              <XIcon className="size-3.5" />
            </InputGroupButton>
            <DropdownMenu>
              <DropdownMenuTrigger render={<InputGroupButton size="icon-sm" />}>
                <ChevronDownIcon className="size-3.5" />
              </DropdownMenuTrigger>
              {presetMenuContent}
            </DropdownMenu>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button className="w-full justify-between" variant="outline" />
            }
          >
            <span>{preset ? PRESET_LABELS[preset] : "Select a date..."}</span>
            <ChevronDownIcon className="size-4 opacity-50" />
          </DropdownMenuTrigger>
          {presetMenuContent}
        </DropdownMenu>
      )}

      <Calendar
        mode="single"
        onSelect={handleCalendarSelect}
        selected={dateValue}
      />
    </div>
  );
}

export type { SingleDateCalendarProps };
export { SingleDateCalendar };
