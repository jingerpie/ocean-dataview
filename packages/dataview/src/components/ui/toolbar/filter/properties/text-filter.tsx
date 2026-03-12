"use client";

import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "../../../../../hooks/use-debounced-callback";
import type { PropertyMeta, WhereRule } from "../../../../../types";
import { Input } from "../../../input";

const FILTER_INPUT_DEBOUNCE_MS = 300;

// ============================================================================
// Types
// ============================================================================

interface TextFilterValueProps {
  onValueChange: (value: unknown) => void;
  property: PropertyMeta;
  rule: WhereRule;
}

// ============================================================================
// DebouncedTextInput - Shared debounced input component
// ============================================================================

interface DebouncedTextInputProps {
  className?: string;
  inputMode?: "numeric";
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  value: string;
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

  // Debounced callback (matches tablecn - no flush on blur)
  const debouncedOnChange = useDebouncedCallback((newValue: string) => {
    onChange(newValue);
  }, FILTER_INPUT_DEBOUNCE_MS);

  // Sync from parent only on external changes
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalValue(value);
    }
    isInternalChange.current = false;
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    isInternalChange.current = true;
    debouncedOnChange(newValue);
  };

  return (
    <Input
      className={className}
      inputMode={inputMode}
      onChange={handleChange}
      placeholder={placeholder}
      type={type}
      value={localValue}
    />
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

// ============================================================================
// TextValueEditor - Inline editor for SimpleFilterEditor
// ============================================================================

function TextValueEditor({
  rule,
  property,
  onValueChange,
}: TextFilterValueProps) {
  const isNumber = property.type === "number";

  return (
    <div className="p-1">
      <Input
        className="h-8"
        inputMode={isNumber ? "numeric" : undefined}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Enter value..."
        type={isNumber ? "number" : "text"}
        value={rule.value != null ? String(rule.value) : ""}
      />
    </div>
  );
}

export { TextAdvanceFilter, TextValueEditor, DebouncedTextInput };
export type { TextFilterValueProps };
