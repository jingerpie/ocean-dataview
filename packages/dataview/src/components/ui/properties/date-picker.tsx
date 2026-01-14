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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import { parseDate as chronoParseDate } from "chrono-node";
import {
	addDays,
	addMonths,
	addWeeks,
	subDays,
	subMonths,
	subWeeks,
} from "date-fns";
import { CalendarIcon, CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import * as React from "react";

interface DatePickerTriggerProps {
	/** Formatted date string */
	formattedDate: string | undefined;
	/** Placeholder text when no date selected */
	placeholder: string;
	/** Whether a date is selected */
	hasValue: boolean;
}

interface DatePickerProps {
	/** Current value (ISO string or timestamp) */
	value: string | number | undefined;
	/** Callback when value changes (receives ISO string) */
	onChange: (value: string) => void;
	/** Placeholder text when no date selected */
	placeholder?: string;
	/** Controlled open state */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Custom trigger render function */
	trigger?: (props: DatePickerTriggerProps) => React.ReactNode;
	/** Content alignment */
	align?: "start" | "center" | "end";
}

/**
 * A date picker component using Popover + Calendar.
 * Can be used for both filter UI and editable cells.
 */
export function DatePicker({
	value,
	onChange,
	placeholder = "Pick date...",
	open,
	onOpenChange,
	trigger,
	align = "start",
}: DatePickerProps) {
	// Internal open state if not controlled
	const [internalOpen, setInternalOpen] = React.useState(false);
	const isControlled = open !== undefined;
	const isOpen = isControlled ? open : internalOpen;
	const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

	// Parse value to Date (handles both ISO strings and timestamps)
	const dateValue = React.useMemo(() => {
		if (!value) return undefined;
		// Try parsing as ISO string first, then as timestamp
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? undefined : date;
	}, [value]);

	// Format date for display
	const formatDate = (date: Date) =>
		date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});

	const formattedDate = dateValue ? formatDate(dateValue) : undefined;
	const hasValue = !!dateValue;

	// Trigger props for custom trigger render
	const triggerProps: DatePickerTriggerProps = {
		formattedDate,
		placeholder,
		hasValue,
	};

	// Default trigger content
	const defaultTrigger = (
		<PopoverTrigger
			render={
				<Button
					variant="outline"
					size="sm"
					className={cn(!hasValue && "text-muted-foreground")}
				/>
			}
		>
			<CalendarIcon className="size-3.5" />
			<span className="truncate">{formattedDate ?? placeholder}</span>
		</PopoverTrigger>
	);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			{trigger ? (
				<PopoverTrigger>{trigger(triggerProps)}</PopoverTrigger>
			) : (
				defaultTrigger
			)}
			<PopoverContent align={align} className="w-auto p-0">
				<Calendar
					mode="single"
					selected={dateValue}
					onSelect={(date) => {
						onChange(date?.toISOString() ?? "");
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}

// ============================================================================
// DatePickerCalendar - Calendar with input and preset dropdown
// ============================================================================

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

function formatDateForDisplay(date: Date) {
	return date.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

function parseDate(text: string): Date | null {
	if (!text) return null;
	return chronoParseDate(text);
}

function parseValue(value: string | number | undefined): Date | undefined {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

interface DatePickerCalendarProps {
	/** Current value (ISO string or timestamp) */
	value: string | number | undefined;
	/** Callback when value changes (receives ISO string) */
	onChange: (value: string) => void;
}

type DatePickerMode = "selector" | "input";

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
 *
 * State transitions:
 * - Select preset (not "Custom") → selector mode, calls onChange
 * - Select "Custom date" → input mode with empty draft, no onChange
 * - Type in input → input mode, calls onChange if valid
 * - Click calendar → input mode, calls onChange
 * - Click clear (×) → input mode, calls onChange with ""
 */
export function DatePickerCalendar({
	value,
	onChange,
}: DatePickerCalendarProps) {
	// State model per plan
	const [preset, setPreset] = React.useState<DatePreset | null>(null);
	const [draft, setDraft] = React.useState<string | null>(null);
	const [isValid, setIsValid] = React.useState(true);

	// Derived values
	const dateValue = parseValue(value);
	const displayValue =
		draft ?? (dateValue ? formatDateForDisplay(dateValue) : "");
	const mode = getMode(preset, draft);

	// Handle preset selection
	const handlePresetSelect = (p: DatePreset | "custom") => {
		if (p === "custom") {
			// Switch to input mode with empty draft
			setPreset(null);
			setDraft("");
			setIsValid(true);
		} else {
			// Switch to selector mode
			setPreset(p);
			setDraft(null);
			setIsValid(true);
			const date = getDateFromPreset(p);
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
			{DATE_PRESETS.map((p) => (
				<DropdownMenuItem
					key={p.value}
					onClick={() => handlePresetSelect(p.value)}
				>
					<span className="flex-1">{p.label}</span>
					{preset === p.value && <CheckIcon className="size-4" />}
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

// ============================================================================
// DateRangePicker - Two inputs + range calendar for "is between" operator
// ============================================================================

interface DateRangeValue {
	from?: string;
	to?: string;
}

interface DateRangePickerProps {
	/** Current value with from/to dates */
	value: DateRangeValue | undefined;
	/** Callback when value changes */
	onChange: (value: DateRangeValue) => void;
}

/**
 * Date range picker with two inputs (Starting/Ending) and a range calendar.
 * Used for "is between" filter operator.
 */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
	// Draft state for inputs
	const [fromDraft, setFromDraft] = React.useState<string | null>(null);
	const [toDraft, setToDraft] = React.useState<string | null>(null);
	const [fromValid, setFromValid] = React.useState(true);
	const [toValid, setToValid] = React.useState(true);

	// Parse values to Date
	const fromDate = parseValue(value?.from);
	const toDate = parseValue(value?.to);

	// Display values
	const fromDisplay =
		fromDraft ?? (fromDate ? formatDateForDisplay(fromDate) : "");
	const toDisplay = toDraft ?? (toDate ? formatDateForDisplay(toDate) : "");

	// Handle from input change
	const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFromDraft(e.target.value);
		setFromValid(true);
	};

	// Handle to input change
	const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setToDraft(e.target.value);
		setToValid(true);
	};

	// Handle from input blur
	const handleFromBlur = () => {
		if (!fromDraft) return;

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
		if (!toDraft) return;

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
	const handleFromKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") e.currentTarget.blur();
	};

	const handleToKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") e.currentTarget.blur();
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
		<div className="flex flex-col gap-2">
			{/* Two inputs side by side */}
			<div className="flex gap-2">
				<input
					type="text"
					placeholder="Starting"
					value={fromDisplay}
					onChange={handleFromChange}
					onBlur={handleFromBlur}
					onKeyDown={handleFromKeyDown}
					className={cn(
						"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
						!fromValid && "border-destructive",
					)}
				/>
				<input
					type="text"
					placeholder="Ending"
					value={toDisplay}
					onChange={handleToChange}
					onBlur={handleToBlur}
					onKeyDown={handleToKeyDown}
					className={cn(
						"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
						!toValid && "border-destructive",
					)}
				/>
			</div>

			{/* Range calendar */}
			<Calendar
				mode="range"
				selected={{ from: fromDate, to: toDate }}
				onSelect={handleRangeSelect}
			/>
		</div>
	);
}

export type {
	DatePickerProps,
	DatePickerTriggerProps,
	DatePickerCalendarProps,
	DateRangePickerProps,
	DateRangeValue,
};
