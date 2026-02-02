"use client";

interface TextPropertyProps {
  value: string | null;
  /**
   * Whether to wrap text instead of truncating
   * @default false
   */
  wrap?: boolean;
}

/**
 * Displays text values with optional truncation or wrapping
 * @param value - The text value to display
 * @param wrap - Whether to wrap text (default: false, truncates)
 * @returns Rendered text or empty value indicator
 */
export function TextProperty({ value, wrap = false }: TextPropertyProps) {
  const text = value != null ? String(value) : "";

  if (!text) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <span className={wrap ? "text-sm" : "truncate text-sm"} title={text}>
      {text}
    </span>
  );
}
