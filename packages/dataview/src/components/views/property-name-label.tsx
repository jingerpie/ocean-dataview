"use client";

import { cn } from "../../lib/utils";
import type { ResolvedShowName } from "../../utils/resolve-show-name";

interface PropertyNameLabelProps {
  name: string;
  resolved: ResolvedShowName;
}

/**
 * PropertyNameLabel - the muted name shown next to a property value.
 * Horizontal layouts keep it on one line so the value gets the remaining width.
 */
export function PropertyNameLabel({ name, resolved }: PropertyNameLabelProps) {
  return (
    <span
      className={cn(
        "text-muted-foreground text-xs",
        resolved.layout === "horizontal" && "shrink-0 whitespace-nowrap"
      )}
    >
      {name}
    </span>
  );
}
