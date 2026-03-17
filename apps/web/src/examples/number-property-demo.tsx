"use client";

import { NumberProperty } from "@sparkyidea/dataview/properties";

export function NumberPropertyDemo() {
  return (
    <div className="flex flex-col gap-4">
      <NumberProperty config={{ numberFormat: "number" }} value={1234.56} />
      <NumberProperty
        config={{ numberFormat: "dollar", decimalPlaces: 2 }}
        value={1234.56}
      />
      <NumberProperty config={{ numberFormat: "percentage" }} value={75} />
      <NumberProperty
        config={{ showAs: { type: "bar", color: "blue", divideBy: 100 } }}
        value={65}
      />
      <NumberProperty
        config={{ showAs: { type: "ring", color: "green", divideBy: 100 } }}
        value={80}
      />
    </div>
  );
}
