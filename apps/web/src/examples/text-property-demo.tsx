"use client";

import { TextProperty } from "@sparkyidea/dataview/properties";

export function TextPropertyDemo() {
  return (
    <div className="flex flex-col gap-4">
      <TextProperty value="Hello World" />
      <TextProperty value="This is a longer text that will be truncated if it exceeds the container width" />
      <TextProperty value={null} />
    </div>
  );
}
