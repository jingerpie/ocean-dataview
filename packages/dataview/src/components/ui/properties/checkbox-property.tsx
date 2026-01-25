"use client";

import { Checkbox } from "@ocean-dataview/dataview/components/ui/checkbox";
import type { CheckboxPropertyType } from "../../../types/property-types";

interface CheckboxPropertyProps<T> {
  value: unknown;
  property: CheckboxPropertyType<T>;
  readOnly?: boolean;
}

export function CheckboxProperty<T>({
  value,
  readOnly = true,
}: CheckboxPropertyProps<T>) {
  const isChecked = Boolean(value);

  return (
    <div className="flex items-center">
      <Checkbox checked={isChecked} disabled={readOnly} />
    </div>
  );
}
