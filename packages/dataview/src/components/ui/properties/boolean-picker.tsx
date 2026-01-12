"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";

interface BooleanPickerProps {
	/** Current value */
	value: string | boolean | undefined;
	/** Callback when value changes */
	onChange: (value: string) => void;
	/** Label for true option */
	trueLabel?: string;
	/** Label for false option */
	falseLabel?: string;
}

/**
 * A picker for boolean values (true/false).
 * Renders as a Select dropdown.
 */
export function BooleanPicker({
	value,
	onChange,
	trueLabel = "True",
	falseLabel = "False",
}: BooleanPickerProps) {
	// Normalize value to string
	const stringValue =
		typeof value === "boolean" ? String(value) : (value ?? "true");

	return (
		<Select
			value={stringValue}
			onValueChange={(value) => {
				if (value) onChange(value);
			}}
		>
			<SelectTrigger size="sm">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="true">{trueLabel}</SelectItem>
				<SelectItem value="false">{falseLabel}</SelectItem>
			</SelectContent>
		</Select>
	);
}

export type { BooleanPickerProps };
