"use client";

import { Badge } from "@ocean-dataview/dataview/components/ui/badge";
import { getBadgeVariant } from "../../../lib/utils/get-badge-variant";
import type { StatusConfig } from "../../../types/property.type";

interface StatusPropertyProps {
  value: unknown;
  config?: StatusConfig;
}

export function StatusProperty({ value, config }: StatusPropertyProps) {
  if (!value) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const stringValue = String(value);

  // Find which group this option belongs to
  const groupInfo = config?.groups?.find((g) =>
    g.options.includes(stringValue)
  );

  // Fallback: gray badge if no matching group found
  if (!groupInfo) {
    return (
      <Badge variant="gray-subtle">
        <div className="h-2 w-2 rounded-full bg-badge-gray-subtle-foreground" />
        {stringValue}
      </Badge>
    );
  }

  const variant = getBadgeVariant(groupInfo.color);

  return (
    <Badge variant={variant}>
      <div
        className={`h-2 w-2 rounded-full bg-badge-${groupInfo.color}-subtle-foreground`}
      />
      {stringValue}
    </Badge>
  );
}
