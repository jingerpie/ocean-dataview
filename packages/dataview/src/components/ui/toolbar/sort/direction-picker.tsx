"use client";

import { cn } from "../../../../lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../select";

const DIRECTION_ITEMS = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

interface DirectionPickerProps {
  /** Additional class names for the trigger */
  className?: string;
  /** Callback when direction changes */
  onValueChange: (direction: "asc" | "desc") => void;
  /** Sort direction */
  value: "asc" | "desc";
}

/**
 * Sort direction picker (Ascending/Descending).
 */
function DirectionPicker({
  value,
  onValueChange,
  className,
}: DirectionPickerProps) {
  return (
    <Select
      items={DIRECTION_ITEMS}
      onValueChange={(v) => onValueChange(v as "asc" | "desc")}
      value={value}
    >
      <SelectTrigger className={cn("w-28", className)}>
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
