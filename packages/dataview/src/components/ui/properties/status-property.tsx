"use client";

import { CircleDashed } from "lucide-react";
import { getBadgeVariant } from "../../../lib/utils/get-badge-variant";
import type { StatusConfig } from "../../../types/property.type";
import { Badge } from "../badge";

interface StatusPropertyProps {
  config?: StatusConfig;
  value: string | null;
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

  // Fallback: gray badge with default icon if no matching group found
  if (!groupInfo) {
    return (
      <Badge variant="gray-subtle">
        <CircleDashed className="size-3 text-current" />
        {stringValue}
      </Badge>
    );
  }

  const variant = getBadgeVariant(groupInfo.color);
  const Icon = groupInfo.icon ?? CircleDashed;

  return (
    <Badge variant={variant}>
      <Icon className="size-3 text-current" />
      {stringValue}
    </Badge>
  );
}
