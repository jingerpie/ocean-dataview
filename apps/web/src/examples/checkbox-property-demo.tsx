"use client";

import { CheckboxProperty } from "@sparkyidea/dataview/properties";

export function CheckboxPropertyDemo() {
  return (
    <div className="flex gap-4">
      <CheckboxProperty value={true} />
      <CheckboxProperty value={false} />
    </div>
  );
}
