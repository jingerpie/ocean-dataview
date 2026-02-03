"use client";

import { CheckIcon } from "lucide-react";
import { Button } from "../../../button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../select";

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
        className="justify-start"
        onClick={() => onChange(true)}
        size="sm"
        variant="ghost"
      >
        <span className="flex-1 text-left">Checked</span>
        {value === true && <CheckIcon className="size-4" />}
      </Button>
      <Button
        className="justify-start"
        onClick={() => onChange(false)}
        size="sm"
        variant="ghost"
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
      onValueChange={(value) => {
        if (value) {
          onChange(value === "checked");
        }
      }}
      value={selectValue}
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
