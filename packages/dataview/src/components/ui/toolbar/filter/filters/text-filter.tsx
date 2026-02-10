"use client";

import type { WhereRule } from "@sparkyidea/shared/types";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "../../../../../hooks/use-debounced-callback";
import type { PropertyMeta } from "../../../../../types";
import { Input } from "../../../input";
import { SimpleFilterPopover } from "../simple/simple-filter-popover";

const FILTER_INPUT_DEBOUNCE_MS = 300;

// ============================================================================
// Types
// ============================================================================

interface TextFilterChipProps {
  rule: WhereRule;
  property: PropertyMeta;
  onRuleChange: (rule: WhereRule) => void;
  onRemove: () => void;
  onAddToAdvanced?: () => void;
  variant?: "compact" | "detailed";
}

interface TextFilterValueProps {
  rule: WhereRule;
  property: PropertyMeta;
  onValueChange: (value: unknown) => void;
}

// ============================================================================
// DebouncedTextInput - Shared debounced input component
// ============================================================================

interface DebouncedTextInputProps {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  inputMode?: "numeric";
  placeholder?: string;
  className?: string;
}

function DebouncedTextInput({
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
  className,
}: DebouncedTextInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const isInternalChange = useRef(false);

  // Proper debounce that resets timer on each call
  const debouncedOnChange = useDebouncedCallback(
    onChange,
    FILTER_INPUT_DEBOUNCE_MS
  );

  // Sync from parent only on external changes
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalValue(value);
    }
    isInternalChange.current = false;
  }, [value]);

  useEffect(() => {
    return () => debouncedOnChange.flush();
  }, [debouncedOnChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    isInternalChange.current = true;
    debouncedOnChange(newValue);
  };

  const handleBlur = () => {
    debouncedOnChange.flush();
  };

  return (
    <Input
      className={className}
      inputMode={inputMode}
      onBlur={handleBlur}
      onChange={handleChange}
      placeholder={placeholder}
      type={type}
      value={localValue}
    />
  );
}

// ============================================================================
// TextSimpleFilter - Chip mode using SimpleFilterPopover
// ============================================================================

function TextSimpleFilter({
  rule,
  property,
  onRuleChange,
  onRemove,
  onAddToAdvanced,
  variant,
}: TextFilterChipProps) {
  const isNumber = property.type === "number";

  const handleValueChange = (value: string) => {
    onRuleChange({ ...rule, value });
  };

  return (
    <SimpleFilterPopover
      onAddToAdvanced={onAddToAdvanced}
      onRemove={onRemove}
      onRuleChange={onRuleChange}
      property={property}
      rule={rule}
      variant={variant}
    >
      <div className="p-1">
        <Input
          className="h-8"
          inputMode={isNumber ? "numeric" : undefined}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Enter value..."
          type={isNumber ? "number" : "text"}
          value={rule.value != null ? String(rule.value) : ""}
        />
      </div>
    </SimpleFilterPopover>
  );
}

// ============================================================================
// TextAdvanceFilter - Row mode (inline DebouncedTextInput)
// ============================================================================

function TextAdvanceFilter({
  rule,
  property,
  onValueChange,
}: TextFilterValueProps) {
  const isNumber = property.type === "number";

  return (
    <DebouncedTextInput
      className="h-8"
      inputMode={isNumber ? "numeric" : undefined}
      onChange={(value) => onValueChange(value)}
      placeholder="Enter value..."
      type={isNumber ? "number" : "text"}
      value={rule.value != null ? String(rule.value) : ""}
    />
  );
}

export { TextSimpleFilter, TextAdvanceFilter, DebouncedTextInput };
export type { TextFilterChipProps, TextFilterValueProps };
