"use client";

import { Checkbox } from "@ocean-dataview/dataview/components/ui/checkbox";

interface CheckboxPropertyProps {
  value: unknown;
  readOnly?: boolean;
}

export function CheckboxProperty({
  value,
  readOnly = true,
}: CheckboxPropertyProps) {
  const isChecked = Boolean(value);

  return (
    <div className="flex items-center">
      <Checkbox checked={isChecked} disabled={readOnly} />
    </div>
  );
}
