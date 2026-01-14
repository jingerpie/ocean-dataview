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
 * SingleDateCalendar props shared between filter UI and inline editors.
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
	}
}

function getMode(
	preset: DatePreset | null,
	draft: string | null,
): DatePickerMode {
	if (preset && draft === null) return "selector"; // Preset selected, not typing
	return "input"; // Default to input mode (custom date)
}

/**
 * Calendar component with two UI modes:
 * - Selector mode: Shows preset label, acts as dropdown trigger
 * - Input mode: Shows editable text input with clear and dropdown buttons (default)
 */
function SingleDateCalendar({ value, onChange }: SingleDateCalendarProps) {
	// State model per plan
	const [preset, setPreset] = useState<DatePreset | null>(null);
	const [draft, setDraft] = useState<string | null>(null);
	const [isValid, setIsValid] = useState(true);

	// Derived values
	const dateValue = parseValue(value);
	const displayValue =
		draft ?? (dateValue ? formatDateForDisplay(dateValue) : "");
	const mode = getMode(preset, draft);

	// Handle preset selection
	const handlePresetSelect = (selected: DatePreset | "custom") => {
		if (selected === "custom") {
			// Switch to input mode with empty draft
			setPreset(null);
			setDraft("");
			setIsValid(true);
		} else {
			// Switch to selector mode
			setPreset(selected);
			setDraft(null);
			setIsValid(true);
			const date = getDateFromPreset(selected);
			onChange(date.toISOString());
		}
	};

	// Handle input changes - just update draft, don't parse yet
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const text = e.target.value;
		setDraft(text);
		setIsValid(true); // Reset validation while typing
		setPreset(null); // Typing = custom date
	};

	// Handle Enter key to confirm input
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.currentTarget.blur();
		}
	};

	// Handle input blur - parse with chrono and auto-format
	const handleBlur = () => {
		if (!draft) return;

		const parsed = parseDate(draft);
		if (parsed) {
			// Valid date - format it and update value
			const formatted = formatDateForDisplay(parsed);
			setDraft(formatted);
			setIsValid(true);
			onChange(parsed.toISOString());
		} else {
			// Invalid date - show error
			setIsValid(false);
		}
	};

	// Handle calendar selection
	const handleCalendarSelect = (date: Date | undefined) => {
		// Calendar click = custom date
		setPreset(null);
		setDraft(null);
		setIsValid(true);
		onChange(date?.toISOString() ?? "");
	};

	// Handle clear button
	const handleClear = () => {
		setPreset(null);
		setDraft(null);
		setIsValid(true);
		onChange("");
	};

	// Shared dropdown content for preset menu
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
			{/* Validation label */}
			{!isValid && (
				<span className="mb-1 text-destructive text-sm">Invalid date</span>
			)}

			{/* Mode-based rendering */}
			{mode === "input" ? (
				// Input mode: editable input + clear + dropdown
				<InputGroup className={cn(!isValid && "border-destructive")}>
					<InputGroupInput
						value={displayValue}
						onChange={handleInputChange}
						onBlur={handleBlur}
						onKeyDown={handleKeyDown}
						placeholder="Select or type a date..."
					/>
					<InputGroupAddon align="inline-end">
						{/* Clear button */}
						<InputGroupButton size="icon-sm" onClick={handleClear}>
							<XIcon className="size-3.5" />
						</InputGroupButton>
						{/* Preset dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger render={<InputGroupButton size="icon-sm" />}>
								<ChevronDownIcon className="size-3.5" />
							</DropdownMenuTrigger>
							{presetMenuContent}
						</DropdownMenu>
					</InputGroupAddon>
				</InputGroup>
			) : (
				// Selector mode: button trigger showing preset label
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button variant="outline" className="w-full justify-between" />
						}
					>
						<span>{preset ? PRESET_LABELS[preset] : "Select a date..."}</span>
						<ChevronDownIcon className="size-4 opacity-50" />
					</DropdownMenuTrigger>
					{presetMenuContent}
				</DropdownMenu>
			)}

			{/* Calendar */}
			<Calendar
				mode="single"
				selected={dateValue}
				onSelect={handleCalendarSelect}
			/>
		</div>
	);
}

export type { SingleDateCalendarProps };
export { SingleDateCalendar };
