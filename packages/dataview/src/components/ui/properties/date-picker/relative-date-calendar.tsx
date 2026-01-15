"use client";

import { Calendar } from "@ocean-dataview/dataview/components/ui/calendar";
import { Input } from "@ocean-dataview/dataview/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";
import {
	addDays,
	addMonths,
	addWeeks,
	addYears,
	endOfDay,
	endOfMonth,
	endOfWeek,
	endOfYear,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
	subDays,
	subMonths,
	subWeeks,
	subYears,
} from "date-fns";

type RelativeDirection = "Past" | "This" | "Next";
type RelativeUnit = "day" | "week" | "month" | "year";

interface RelativeToTodayValue {
	direction: RelativeDirection;
	count: number;
	unit: RelativeUnit;
}

interface RelativeDateCalendarProps {
	/** Current value with direction, count, and unit */
	value: RelativeToTodayValue | undefined;
	/** Callback when value changes */
	onChange: (value: RelativeToTodayValue) => void;
}

const directionItems = [
	{ label: "Past", value: "Past" },
	{ label: "This", value: "This" },
	{ label: "Next", value: "Next" },
];

const unitItems = [
	{ label: "day", value: "day" },
	{ label: "week", value: "week" },
	{ label: "month", value: "month" },
	{ label: "year", value: "year" },
];

/**
 * Calculate date range for relative date filter.
 * Returns start and end dates for the given direction, count, and unit.
 */
function getRelativeDateRange(
	now: Date,
	direction: RelativeDirection,
	count: number,
	unit: RelativeUnit,
): { start: Date; end: Date } {
	// For "This" direction, count is always 1
	const n = direction === "This" ? 1 : count;

	switch (unit) {
		case "day":
			if (direction === "Past") {
				return {
					start: startOfDay(subDays(now, n)),
					end: endOfDay(subDays(now, 1)),
				};
			}
			if (direction === "Next") {
				return {
					start: startOfDay(addDays(now, 1)),
					end: endOfDay(addDays(now, n)),
				};
			}
			// This
			return { start: startOfDay(now), end: endOfDay(now) };

		case "week":
			if (direction === "Past") {
				return {
					start: startOfWeek(subWeeks(now, n)),
					end: endOfWeek(subWeeks(now, 1)),
				};
			}
			if (direction === "Next") {
				return {
					start: startOfWeek(addWeeks(now, 1)),
					end: endOfWeek(addWeeks(now, n)),
				};
			}
			// This
			return { start: startOfWeek(now), end: endOfWeek(now) };

		case "month":
			if (direction === "Past") {
				return {
					start: startOfMonth(subMonths(now, n)),
					end: endOfMonth(subMonths(now, 1)),
				};
			}
			if (direction === "Next") {
				return {
					start: startOfMonth(addMonths(now, 1)),
					end: endOfMonth(addMonths(now, n)),
				};
			}
			// This
			return { start: startOfMonth(now), end: endOfMonth(now) };

		case "year":
			if (direction === "Past") {
				return {
					start: startOfYear(subYears(now, n)),
					end: endOfYear(subYears(now, 1)),
				};
			}
			if (direction === "Next") {
				return {
					start: startOfYear(addYears(now, 1)),
					end: endOfYear(addYears(now, n)),
				};
			}
			// This
			return { start: startOfYear(now), end: endOfYear(now) };

		default:
			return { start: startOfDay(now), end: endOfDay(now) };
	}
}

/**
 * Relative date picker with dropdowns (direction/count/unit) and a read-only calendar.
 * Used for "is relative to today" filter operator.
 *
 * UI Layout:
 * - "This" direction: [This ▼] [week ▼]
 * - "Past/Next" direction: [Past ▼] [1] [week ▼]
 *
 * The calendar is display-only - it shows the computed date range
 * but users cannot click to select dates.
 */
function RelativeDateCalendar({ value, onChange }: RelativeDateCalendarProps) {
	// Default to "This week" if no value
	const direction = value?.direction ?? "This";
	const count = value?.count ?? 1;
	const unit = value?.unit ?? "week";

	// Show count input only for Past/Next (not "This")
	const showCount = direction !== "This";

	// Calculate date range for calendar display
	const now = new Date();
	const dateRange = getRelativeDateRange(now, direction, count, unit);

	// Handle direction change
	const handleDirectionChange = (newDirection: RelativeDirection | null) => {
		if (!newDirection) return;
		onChange({
			direction: newDirection,
			count,
			unit,
		});
	};

	// Handle count change
	const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newCount = Math.max(1, Number.parseInt(e.target.value, 10) || 1);
		onChange({ direction, count: newCount, unit });
	};

	// Handle unit change
	const handleUnitChange = (newUnit: RelativeUnit | null) => {
		if (!newUnit) return;
		onChange({ direction, count, unit: newUnit });
	};

	return (
		<div className="flex flex-col items-center gap-2">
			{/* Dropdowns and count input */}
			<div className="flex w-full gap-2">
				<Select
					items={directionItems}
					value={direction}
					onValueChange={handleDirectionChange}
				>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{directionItems.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Count input - only show for past/next */}
				{showCount && (
					<Input
						type="number"
						min={1}
						value={count}
						onChange={handleCountChange}
						className="w-fit"
					/>
				)}

				<Select items={unitItems} value={unit} onValueChange={handleUnitChange}>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{unitItems.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Calendar - display only, shows computed range */}
			{/* Key forces re-mount when range changes to update displayed month */}
			{/* Using defaultMonth instead of month to allow navigation with < > buttons */}
			<Calendar
				key={`${direction}-${count}-${unit}`}
				mode="range"
				selected={{ from: dateRange.start, to: dateRange.end }}
				defaultMonth={dateRange.start}
				readOnly
			/>
		</div>
	);
}

export type { RelativeDateCalendarProps, RelativeToTodayValue };
export { RelativeDateCalendar };
