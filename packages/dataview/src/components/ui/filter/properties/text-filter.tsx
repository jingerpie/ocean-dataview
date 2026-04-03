"use client";

import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "../../../../hooks/use-debounced-callback";
import type { WhereRule } from "../../../../types/filter.type";
import type {
  NumberConfig,
  PropertyMeta,
} from "../../../../types/property.type";
import { Input } from "../../input";

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
// Scale helpers for cents → dollars (or other unit conversions)
// ============================================================================

function getScale(property: PropertyMeta): number {
  if (property.type !== "number") {
    return 1;
  }
  return (property.config as NumberConfig | undefined)?.scale ?? 1;
}

/** Convert stored value to display value (e.g. 1299 → "12.99" when scale=100) */
function toDisplayValue(value: unknown, scale: number): string {
  if (value == null) {
    return "";
  }
  if (scale !== 1) {
    return String(Number(value) / scale);
  }
  return String(value);
}

/** Convert user input to stored value (e.g. "12.99" → 1299 when scale=100) */
function toStoredValue(
  input: string,
  scale: number,
  onValueChange: (value: unknown) => void
) {
  if (scale !== 1 && input !== "") {
    onValueChange(Math.round(Number(input) * scale));
  } else {
    onValueChange(input);
  }
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
  const scale = getScale(property);
  const displayValue = toDisplayValue(rule.value, scale);

  return (
    <DebouncedTextInput
      className="h-8"
      inputMode={isNumber ? "numeric" : undefined}
      onChange={(value) => toStoredValue(value, scale, onValueChange)}
      placeholder="Enter value..."
      type={isNumber ? "number" : "text"}
      value={displayValue}
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
  const scale = getScale(property);
  const displayValue = toDisplayValue(rule.value, scale);

  return (
    <div className="p-1">
      <Input
        className="h-8"
        inputMode={isNumber ? "numeric" : undefined}
        onChange={(e) => toStoredValue(e.target.value, scale, onValueChange)}
        placeholder="Enter value..."
        type={isNumber ? "number" : "text"}
        value={displayValue}
      />
    </div>
  );
}

export type { TextFilterValueProps };
export { DebouncedTextInput, TextAdvanceFilter, TextValueEditor };
