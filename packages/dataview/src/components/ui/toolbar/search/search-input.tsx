"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { cn } from "../../../../lib/utils";
import { Button } from "../../button";
import { Input } from "../../input";

interface SearchInputProps {
  /** Current search value (from parent state) */
  value: string;
  /** Callback when search value changes - called immediately on every keystroke */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional class names */
  className?: string;
  /**
   * Trigger variant (for collapsed state):
   * - `default` - Icon + text, outline button
   * - `icon` - Icon only, ghost button
   */
  variant?: "default" | "icon";
}

/**
 * Expandable search input with local state for responsive typing.
 *
 * Architecture (following tablecn pattern):
 * - Maintains local state for immediate input feedback
 * - Calls onChange immediately on every keystroke (parent handles debouncing)
 * - Only syncs from parent value on "external" changes (navigation, clear from outside)
 *   not on changes triggered by this component's own typing
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Type to search...",
  className,
  variant = "default",
}: SearchInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track if we're the source of the change to prevent feedback loop
  const isInternalChange = useRef(false);

  // Sync from parent value only on external changes (navigation, programmatic updates)
  // Skip sync if we triggered the change ourselves
  useEffect(() => {
    if (!isInternalChange.current) {
      setLocalValue(value);
    }
    isInternalChange.current = false;
  }, [value]);

  // Auto-expand when value exists
  useEffect(() => {
    if (value && !expanded) {
      setExpanded(true);
    }
  }, [value, expanded]);

  // Focus input when expanded
  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  const handleExpand = () => {
    setExpanded(true);
  };

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    isInternalChange.current = true;
    onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue("");
    isInternalChange.current = true;
    onChange("");
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    // Collapse only if empty
    if (!localValue) {
      setExpanded(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (localValue) {
        handleClear();
      } else {
        setExpanded(false);
        inputRef.current?.blur();
      }
    }
  };

  // Collapsed state - trigger button
  if (!expanded) {
    return variant === "icon" ? (
      <Button
        aria-label="Open search"
        className={className}
        onClick={handleExpand}
        size="icon"
        variant="ghost"
      >
        <SearchIcon className="size-4" />
      </Button>
    ) : (
      <Button
        aria-label="Open search"
        className={className}
        onClick={handleExpand}
        variant="outline"
      >
        <SearchIcon className="size-4" />
        <span>Search</span>
      </Button>
    );
  }

  // Expanded state - input with icon
  return (
    <div
      className={cn(
        "relative flex items-center",
        "fade-in slide-in-from-right-2 w-50 animate-in duration-200",
        className
      )}
    >
      <SearchIcon className="absolute left-2.5 size-4 text-muted-foreground" />
      <Input
        className="h-8 pr-8 pl-8"
        onBlur={handleBlur}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        type="text"
        value={localValue}
      />
      {localValue && (
        <Button
          aria-label="Clear search"
          className="absolute right-1"
          onClick={handleClear}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}

export type { SearchInputProps };
