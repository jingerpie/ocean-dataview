"use client";

import { getBadgeVariant } from "../../../lib/utils/get-badge-variant";
import type { SelectConfig } from "../../../types/property.type";
import { Badge } from "../badge";

interface SelectPropertyProps {
  config?: SelectConfig;
  value: string | null;
}

/**
 * Displays single-select values as styled badges
 * Automatically generates badge colors from config options
 * @param value - The selected value
 * @param config - Select configuration with options
 * @returns Colored badge with option label
 */
export function SelectProperty({ value, config }: SelectPropertyProps) {
  if (!value) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const stringValue = String(value);
  const option = config?.options?.find((opt) => opt.value === stringValue);

  // If option not found, still render as badge with gray color
  if (!option) {
    return <Badge variant="gray-subtle">{stringValue}</Badge>;
  }

  const variant = getBadgeVariant(option.color);

  return <Badge variant={variant}>{option.value}</Badge>;
}
