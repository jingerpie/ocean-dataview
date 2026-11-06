"use client";

import { Checkbox } from "@/components/ui/dataview-checkbox";

interface CheckboxPropertyProps {
  value: boolean | null;
}

export function CheckboxProperty({ value }: CheckboxPropertyProps) {
  const isChecked = Boolean(value);

  return (
    <div className="flex items-center">
      <Checkbox checked={isChecked} disabled />
    </div>
  );
}
