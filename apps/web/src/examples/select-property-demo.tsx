"use client";

import { SelectProperty } from "@sparkyidea/dataview/properties";

const config = {
  options: [
    { value: "electronics", color: "blue" as const },
    { value: "clothing", color: "purple" as const },
    { value: "food", color: "green" as const },
  ],
};

export function SelectPropertyDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <SelectProperty config={config} value="electronics" />
      <SelectProperty config={config} value="clothing" />
      <SelectProperty config={config} value="food" />
    </div>
  );
}
