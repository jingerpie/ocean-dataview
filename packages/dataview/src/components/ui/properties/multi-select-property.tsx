"use client";

import { Badge } from "@ocean-dataview/dataview/components/ui/badge";
import { getBadgeVariant } from "../../../lib/utils/get-badge-variant";
import type { MultiSelectConfig } from "../../../types/property-types";

interface MultiSelectPropertyProps {
  value: unknown;
  config?: MultiSelectConfig;
}

export function MultiSelectProperty({
  value,
  config,
}: MultiSelectPropertyProps) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const displayLimit = config?.displayLimit ?? 2;
  const values = Array.isArray(value) ? value : [value];

  const visibleValues = values.slice(0, displayLimit);
  const remainingCount = values.length - displayLimit;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleValues.map((val) => {
        const stringValue = String(val);
        const option = config?.options?.find(
          (opt) => opt.value === stringValue
        );

        // If option not found, still render as badge with gray color
        if (!option) {
          return (
            <Badge key={stringValue} variant="gray-subtle">
              {stringValue}
            </Badge>
          );
        }

        const variant = getBadgeVariant(option.color);

        return (
          <Badge key={option.value} variant={variant}>
            {option.value}
          </Badge>
        );
      })}
      {remainingCount > 0 && <Badge variant="outline">+{remainingCount}</Badge>}
    </div>
  );
}
