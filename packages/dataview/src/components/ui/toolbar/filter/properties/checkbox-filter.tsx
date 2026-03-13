"use client";

import { CheckIcon } from "lucide-react";
import type { PropertyMeta, WhereRule } from "../../../../../types";
import { Button } from "../../../button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../select";

// ============================================================================
// Types
// ============================================================================

interface CheckboxFilterValueProps {
  onValueChange: (value: unknown) => void;
  property: PropertyMeta;
  rule: WhereRule;
}

// ============================================================================
// CheckboxBody - Inline picker content
// ============================================================================

interface CheckboxBodyProps {
  onChange: (value: boolean) => void;
  value: boolean | undefined;
}

function CheckboxBody({ value, onChange }: CheckboxBodyProps) {
  return (
    <div className="flex flex-col gap-0.5 p-1">
      <Button
        className="justify-start"
        onClick={() => onChange(true)}
        variant="ghost"
      >
        <span className="flex-1 text-left">Checked</span>
        {value === true && <CheckIcon className="size-4" />}
      </Button>
      <Button
        className="justify-start"
        onClick={() => onChange(false)}
        variant="ghost"
      >
        <span className="flex-1 text-left">Unchecked</span>
        {value === false && <CheckIcon className="size-4" />}
      </Button>
    </div>
  );
}

// ============================================================================
// CheckboxAdvanceFilter - Row mode (Select dropdown)
// ============================================================================

const selectItems = [
  { label: "Checked", value: "checked" },
  { label: "Unchecked", value: "unchecked" },
];

function CheckboxAdvanceFilter({
  rule,
  onValueChange,
}: CheckboxFilterValueProps) {
  const selectValue = rule.value === false ? "unchecked" : "checked";

  return (
    <Select
      items={selectItems}
      onValueChange={(value) => {
        if (value) {
          onValueChange(value === "checked");
        }
      }}
      value={selectValue}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {selectItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// CheckboxValueEditor - Inline editor for SimpleFilterEditor
// ============================================================================

function CheckboxValueEditor({
  rule,
  onValueChange,
}: CheckboxFilterValueProps) {
  return (
    <CheckboxBody
      onChange={(value) => onValueChange(value)}
      value={rule.value as boolean | undefined}
    />
  );
}

export { CheckboxAdvanceFilter, CheckboxValueEditor };
export type { CheckboxFilterValueProps };
