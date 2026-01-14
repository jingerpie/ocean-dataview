"use client";

import { Calendar } from "@ocean-dataview/dataview/components/ui/calendar";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import {
	cn,
	formatDateForDisplay,
	parseDate,
	parseValue,
} from "@ocean-dataview/dataview/lib/utils";
import * as React from "react";

interface DateRangeValue {
	from?: string;
	to?: string;
}

interface RangeDateCalendarProps {
	/** Current value with from/to dates */
	value: DateRangeValue | undefined;
	/** Callback when value changes */
	onChange: (value: DateRangeValue) => void;
}

/**
 * Date range picker with two inputs (Starting/Ending) and a range calendar.
 * Used for "is between" filter operator.
 */
function RangeDateCalendar({ value, onChange }: RangeDateCalendarProps) {
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
		<div className="flex flex-col items-center">
			{/* Two inputs side by side */}
			<div className="flex gap-2">
				<Input
					type="text"
					placeholder="Starting"
					value={fromDisplay}
					onChange={handleFromChange}
					onBlur={handleFromBlur}
					onKeyDown={handleFromKeyDown}
					className={cn(
						!fromValid && "border-destructive focus-visible:ring-destructive",
					)}
				/>
				<Input
					type="text"
					placeholder="Ending"
					value={toDisplay}
					onChange={handleToChange}
					onBlur={handleToBlur}
					onKeyDown={handleToKeyDown}
					className={cn(
						!toValid && "border-destructive focus-visible:ring-destructive",
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

export type { RangeDateCalendarProps, DateRangeValue };
export { RangeDateCalendar };
