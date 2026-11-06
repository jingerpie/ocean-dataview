"use client";

import { CheckboxProperty } from "@/registry/base-nova/components/dataview/properties/checkbox-property";

export function CheckboxPropertyDemo() {
  return (
    <div className="flex gap-4">
      <CheckboxProperty value={true} />
      <CheckboxProperty value={false} />
    </div>
  );
}
