"use client";

import { DateProperty } from "@sparkyidea/dataview/properties";

export function DatePropertyDemo() {
  const date = new Date("2026-03-15T14:30:00");

  return (
    <div className="flex flex-col gap-2">
      <DateProperty config={{ dateFormat: "full" }} value={date} />
      <DateProperty config={{ dateFormat: "short" }} value={date} />
      <DateProperty config={{ dateFormat: "relative" }} value={date} />
      <DateProperty config={{ dateFormat: "YMD" }} value={date} />
    </div>
  );
}
