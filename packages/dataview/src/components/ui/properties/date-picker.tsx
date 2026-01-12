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
	/** Current value (timestamp as string or number) */
	value: string | number | undefined;
	/** Callback when value changes (receives timestamp as string) */
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

	// Parse value to Date
	const dateValue = value ? new Date(Number(value)) : undefined;

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
						onChange(date?.getTime().toString() ?? "");
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}

export type { DatePickerProps, DatePickerTriggerProps };
