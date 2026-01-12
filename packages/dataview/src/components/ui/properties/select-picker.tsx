"use client";

import { Badge } from "@ocean-dataview/dataview/components/ui/badge";
import { Button } from "@ocean-dataview/dataview/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
} from "@ocean-dataview/dataview/components/ui/combobox";
import type { SelectOption } from "@ocean-dataview/dataview/types";
import * as React from "react";
import { getBadgeVariant } from "../../../lib/utils/get-badge-variant";

interface SelectPickerTriggerProps {
	/** Currently selected values */
	selectedValues: string[];
	/** Labels of selected options */
	selectedLabels: string[];
	/** Number of selected items */
	selectedCount: number;
	/** Placeholder text when nothing selected */
	placeholder: string;
}

interface SelectPickerProps {
	/** Available options to select from */
	options: SelectOption[];
	/** Currently selected values (array of option values) */
	value: string[];
	/** Callback when selection changes */
	onChange: (values: string[]) => void;
	/** Placeholder text when nothing selected */
	placeholder?: string;
	/** Controlled open state */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Custom trigger render function */
	trigger?: (props: SelectPickerTriggerProps) => React.ReactNode;
	/** Content alignment */
	align?: "start" | "center" | "end";
	/** Additional class name for content */
	className?: string;
}

/**
 * A multi-select picker component using Combobox.
 * Displays options as badges with search functionality.
 * Can be used for both filter UI and editable cells.
 */
export function SelectPicker({
	options,
	value,
	onChange,
	placeholder = "Select...",
	open,
	onOpenChange,
	trigger,
	align = "start",
	className,
}: SelectPickerProps) {
	// Internal open state if not controlled
	const [internalOpen, setInternalOpen] = React.useState(false);
	const isControlled = open !== undefined;
	const isOpen = isControlled ? open : internalOpen;
	const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

	// Get selected options as objects for the Combobox value prop
	const selectedOptions = options.filter((o) => value.includes(o.value));
	const selectedLabels = selectedOptions.map((o) => o.label);

	// Trigger props for custom trigger render
	const triggerProps: SelectPickerTriggerProps = {
		selectedValues: value,
		selectedLabels,
		selectedCount: value.length,
		placeholder,
	};

	// Default trigger content
	const defaultTriggerContent = (
		<span className="truncate">
			{value.length === 0
				? placeholder
				: value.length > 1
					? `${value.length} selected`
					: (selectedLabels[0] ?? value[0])}
		</span>
	);

	return (
		<Combobox
			multiple
			items={options}
			value={selectedOptions}
			open={isOpen}
			onOpenChange={setIsOpen}
			onValueChange={(newValues) => {
				const values = (newValues as SelectOption[]).map((o) => o.value);
				onChange(values);
			}}
		>
			{trigger ? (
				<ComboboxTrigger>{trigger(triggerProps)}</ComboboxTrigger>
			) : (
				<ComboboxTrigger render={<Button variant="outline" size="sm" />}>
					{defaultTriggerContent}
				</ComboboxTrigger>
			)}
			<ComboboxContent align={align} className={className ?? "w-56"}>
				<ComboboxInput showTrigger={false} placeholder="Search options..." />
				<ComboboxEmpty>No options found.</ComboboxEmpty>
				<ComboboxList>
					{(option) => (
						<ComboboxItem key={option.value} value={option}>
							<Badge variant={getBadgeVariant(option.color)}>
								{option.label}
							</Badge>
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export type { SelectPickerProps, SelectPickerTriggerProps };
