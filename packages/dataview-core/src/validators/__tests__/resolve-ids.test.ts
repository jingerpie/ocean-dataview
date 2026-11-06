import { describe, expect, it } from "vitest";
import type { DataViewProperty } from "../../types/property.type";
import { validate } from "../index";
import { validateColumn } from "../valid-column";
import { validateFilter } from "../valid-filter";
import { validateSort } from "../valid-sort";

interface Item {
  category: string;
  price: number;
  title: string;
}

// Raw definitions as consumers write them: `key` only, no `id`
const properties = [
  { key: "title", name: "Title", type: "text" },
  { key: "price", name: "Price", type: "number" },
  {
    key: "category",
    name: "Category",
    type: "select",
    config: { options: [{ value: "Jewelry" }] },
  },
] as unknown as DataViewProperty<Item>[];

describe("validators with key-only properties", () => {
  it("keeps a filter on a key-only property", () => {
    const filter = [
      {
        property: "category",
        condition: "inArray" as const,
        value: ["Jewelry"],
      },
    ];
    expect(validateFilter(filter, properties)).toEqual(filter);
  });

  it("keeps a sort on a key-only property", () => {
    const sort = [{ property: "price", direction: "asc" as const }];
    expect(validateSort(sort, properties)).toEqual(sort);
  });

  it("keeps a column on a key-only property", () => {
    const column = { propertyType: "select", propertyId: "category" } as const;
    expect(validateColumn(column, properties)).toEqual(column);
  });

  it("builds search fields from key-only properties", () => {
    expect(
      validate({ search: "ring" }, properties).search?.searchFields
    ).toContain("title");
  });

  it("still drops rules on unknown properties", () => {
    const filter = [
      { property: "missing", condition: "eq" as const, value: 1 },
    ];
    expect(validateFilter(filter, properties)).toBeNull();
  });
});
