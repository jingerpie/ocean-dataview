"use client";

import type { WhereRule } from "@sparkyidea/shared/types";
import { CheckIcon } from "lucide-react";
import type { PropertyMeta } from "../../../../../types";
import { Button } from "../../../button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../select";
import { SimpleFilterPopover } from "../simple/simple-filter-popover";

// ============================================================================
// Types
// ============================================================================

interface CheckboxFilterChipProps {
  rule: WhereRule;
  property: PropertyMeta;
  onRuleChange: (rule: WhereRule) => void;
  onRemove: () => void;
  onAddToAdvanced?: () => void;
  variant?: "compact" | "detailed";
}

interface CheckboxFilterValueProps {
  rule: WhereRule;
  property: PropertyMeta;
  onValueChange: (value: unknown) => void;
}

// ============================================================================
// CheckboxBody - Inline picker content
// ============================================================================

interface CheckboxBodyProps {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}

function CheckboxBody({ value, onChange }: CheckboxBodyProps) {
  return (
    <div className="flex flex-col gap-0.5 p-1">
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

// ============================================================================
// CheckboxSimpleFilter - Chip mode using SimpleFilterPopover
// ============================================================================

function CheckboxSimpleFilter({
  rule,
  property,
  onRuleChange,
  onRemove,
  onAddToAdvanced,
  variant,
}: CheckboxFilterChipProps) {
  const handleValueChange = (value: boolean) => {
    onRuleChange({ ...rule, value });
  };

  return (
    <SimpleFilterPopover
      classNames="p-0"
      onAddToAdvanced={onAddToAdvanced}
      onRemove={onRemove}
      onRuleChange={onRuleChange}
      property={property}
      rule={rule}
      variant={variant}
    >
      <CheckboxBody
        onChange={handleValueChange}
        value={rule.value as boolean | undefined}
      />
    </SimpleFilterPopover>
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
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {selectItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { CheckboxSimpleFilter, CheckboxAdvanceFilter };
export type { CheckboxFilterChipProps, CheckboxFilterValueProps };
