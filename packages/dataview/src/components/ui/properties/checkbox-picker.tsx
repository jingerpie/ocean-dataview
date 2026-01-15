"use client";

import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";
import { CheckIcon } from "lucide-react";

interface CheckboxPickerProps {
	value: boolean | undefined;
	onChange: (value: boolean) => void;
}

const items = [
	{ label: "Checked", value: "checked" },
	{ label: "Unchecked", value: "unchecked" },
];

/**
 * Content component for checkbox picker.
 * Renders as a list of options - used inside filter chip popover.
 */
function CheckboxPickerContent({ value, onChange }: CheckboxPickerProps) {
	return (
		<div className="flex flex-col gap-0.5">
			<Button
				variant="ghost"
				size="sm"
				className="justify-start"
				onClick={() => onChange(true)}
			>
				<span className="flex-1 text-left">Checked</span>
				{value === true && <CheckIcon className="size-4" />}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				className="justify-start"
				onClick={() => onChange(false)}
			>
				<span className="flex-1 text-left">Unchecked</span>
				{value === false && <CheckIcon className="size-4" />}
			</Button>
		</div>
	);
}

/**
 * Full picker component with trigger.
 * Renders as a Select dropdown - used in advanced filter rules.
 */
function CheckboxPicker({ value, onChange }: CheckboxPickerProps) {
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

export { CheckboxPicker, CheckboxPickerContent };
export type { CheckboxPickerProps };
