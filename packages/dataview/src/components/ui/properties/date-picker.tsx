"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import { Calendar } from "@ocean-dataview/dataview/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ocean-dataview/dataview/components/ui/popover";
import { cn } from "@ocean-dataview/dataview/lib/utils";
import { CalendarIcon } from "lucide-react";
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
// DatePickerCalendar - Just the calendar without popover wrapper
// ============================================================================

interface DatePickerCalendarProps {
	/** Current value (ISO string or timestamp) */
	value: string | number | undefined;
	/** Callback when value changes (receives ISO string) */
	onChange: (value: string) => void;
}

/**
 * Calendar-only component for use in contexts that already have a popover.
 * Useful for filter chips where the parent already provides the popover.
 */
export function DatePickerCalendar({
	value,
	onChange,
}: DatePickerCalendarProps) {
	// Parse value to Date (handles both ISO strings and timestamps)
	const dateValue = React.useMemo(() => {
		if (!value) return undefined;
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? undefined : date;
	}, [value]);

	return (
		<Calendar
			mode="single"
			selected={dateValue}
			onSelect={(date) => {
				onChange(date?.toISOString() ?? "");
			}}
		/>
	);
}

export type {
	DatePickerProps,
	DatePickerTriggerProps,
	DatePickerCalendarProps,
};
