"use client";

import { type ReactNode, useState } from "react";
import { getBadgeVariant } from "../../../../../lib/utils/get-badge-variant";
import type { SelectOption } from "../../../../../types";
import { Badge } from "../../../badge";
import { Button } from "../../../button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "../../../combobox";

// ============================================================================
// SelectPickerContent - Reusable dropdown content
// ============================================================================

interface SelectPickerContentProps {
  /** Content alignment */
  align?: "start" | "center" | "end";
  /** Additional class name */
  className?: string;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * The dropdown content for SelectPicker.
 * Must be used inside a Combobox component.
 * Contains search input and options list with badges.
 */
function SelectPickerContent({
  align = "start",
  className = "w-56",
  searchPlaceholder = "Search options...",
  emptyMessage = "No options found.",
}: SelectPickerContentProps) {
  return (
    <ComboboxContent align={align} className={className}>
      <ComboboxInput placeholder={searchPlaceholder} showTrigger={false} />
      <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
      <ComboboxList>
        {(option: SelectOption) => (
          <ComboboxItem key={option.value} value={option}>
            <Badge variant={getBadgeVariant(option.color)}>
              {option.value}
            </Badge>
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  );
}

// ============================================================================
// SelectPicker - Full component with trigger
// ============================================================================

interface SelectPickerTriggerProps {
  /** Currently selected values */
  selectedValues: string[];
  /** Selected options with full data */
  selectedOptions: SelectOption[];
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
  trigger?: (props: SelectPickerTriggerProps) => ReactNode;
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
function SelectPicker({
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
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  // Get selected options as objects for the Combobox value prop
  const selectedOptions = options.filter((o) => value.includes(o.value));

  // Trigger props for custom trigger render
  const triggerProps: SelectPickerTriggerProps = {
    selectedValues: value,
    selectedOptions,
    selectedCount: value.length,
    placeholder,
  };

  // Default trigger content
  let triggerText: string;
  if (value.length === 0) {
    triggerText = placeholder;
  } else if (value.length > 1) {
    triggerText = `${value.length} selected`;
  } else {
    triggerText = value[0] ?? placeholder;
  }
  const defaultTriggerContent = <span className="truncate">{triggerText}</span>;

  return (
    <Combobox
      items={options}
      multiple
      onOpenChange={setIsOpen}
      onValueChange={(newValues) => {
        const values = (newValues as SelectOption[]).map((o) => o.value);
        onChange(values);
      }}
      open={isOpen}
      value={selectedOptions}
    >
      {trigger ? (
        <ComboboxTrigger>{trigger(triggerProps)}</ComboboxTrigger>
      ) : (
        <ComboboxTrigger render={<Button size="sm" variant="outline" />}>
          {defaultTriggerContent}
        </ComboboxTrigger>
      )}
      <SelectPickerContent align={align} className={className} />
    </Combobox>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { SelectPicker, SelectPickerContent };
export type {
  SelectPickerProps,
  SelectPickerTriggerProps,
  SelectPickerContentProps,
};
