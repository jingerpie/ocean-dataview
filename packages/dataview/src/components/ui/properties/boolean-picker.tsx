"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";

interface BooleanPickerProps {
	value: boolean | undefined;
	onChange: (value: boolean) => void;
}

const items = [
	{ label: "True", value: "true" },
	{ label: "False", value: "false" },
];

/**
 * A picker for boolean values (true/false).
 * Renders as a Select dropdown.
 */
export function BooleanPicker({ value, onChange }: BooleanPickerProps) {
	// Convert boolean to string for Select (which requires string values)
	const selectValue = value === false ? "false" : "true";

	return (
		<Select
			items={items}
			value={selectValue}
			onValueChange={(value) => {
				if (value) onChange(value === "true");
			}}
		>
			<SelectTrigger size="sm">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{items.map((item) => (
					<SelectItem key={item.value} value={item.value}>
						{item.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

export type { BooleanPickerProps };
