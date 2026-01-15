"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";

interface CheckboxPickerProps {
	value: boolean | undefined;
	onChange: (value: boolean) => void;
}

const items = [
	{ label: "Checked", value: "checked" },
	{ label: "Unchecked", value: "unchecked" },
];

/**
 * A picker for checkbox/boolean values.
 * Renders as a Select dropdown with Checked/Unchecked options.
 */
export function CheckboxPicker({ value, onChange }: CheckboxPickerProps) {
	const selectValue = value === false ? "unchecked" : "checked";

	return (
		<Select
			items={items}
			value={selectValue}
			onValueChange={(value) => {
				if (value) onChange(value === "checked");
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

export type { CheckboxPickerProps };
