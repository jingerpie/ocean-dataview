"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ocean-dataview/dataview/components/ui/select";
import { cn } from "@ocean-dataview/dataview/lib/utils";

const DIRECTION_ITEMS = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

interface DirectionPickerProps {
  /** Whether sort is descending */
  value: boolean;
  /** Callback when direction changes */
  onValueChange: (desc: boolean) => void;
  /** Additional class names for the trigger */
  className?: string;
}

/**
 * Sort direction picker (Ascending/Descending).
 *
 * Accepts boolean `desc` value internally but displays as "Ascending"/"Descending".
 */
function DirectionPicker({
  value,
  onValueChange,
  className,
}: DirectionPickerProps) {
  return (
    <Select
      items={DIRECTION_ITEMS}
      onValueChange={(v) => onValueChange(v === "desc")}
      value={value ? "desc" : "asc"}
    >
      <SelectTrigger className={cn("w-28", className)} size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {DIRECTION_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export { DirectionPicker, type DirectionPickerProps };
