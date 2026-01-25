"use client";

import type { TextPropertyType } from "../../../types/property-types";

interface TextPropertyProps<T> {
  value: unknown;
  property: TextPropertyType<T>;
  wrap?: boolean;
}

/**
 * Displays text values with optional wrapping
 * @param value - The text value to display
 * @param wrap - Whether to wrap text (default: false, truncates with ellipsis)
 * @returns Rendered text or empty value indicator
 */
export function TextProperty<T>({ value, wrap = false }: TextPropertyProps<T>) {
  const text = value != null ? String(value) : "";

  if (!text) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const className = wrap ? "text-sm break-words" : "text-sm truncate";

  return (
    <span className={className} title={text}>
      {text}
    </span>
  );
}
