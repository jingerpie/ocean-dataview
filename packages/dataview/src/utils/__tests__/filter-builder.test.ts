import { describe, expect, it } from "vitest";
import type { PropertyMeta } from "../../types/property.type";
import { buildIdToKeyMap, resolveFilterKeys } from "../filter-builder";

const properties: PropertyMeta[] = [
  { id: "name", key: "name", type: "text" },
  { id: "title", key: "productName", type: "text" },
  {
    id: "minQty",
    key: "variants.quantity",
    type: "rollup",
    config: { calculation: "min", type: "number" },
  } as PropertyMeta,
  {
    id: "maxQty",
    key: "variants.quantity",
    type: "rollup",
    config: { calculation: "max", type: "number" },
  } as PropertyMeta,
  {
    id: "skus",
    key: "variants.sku",
    type: "rollup",
    config: { calculation: "showOriginal", type: "text" },
  } as PropertyMeta,
];

describe("buildIdToKeyMap", () => {
  it("skips properties whose id equals key", () => {
    expect(buildIdToKeyMap(properties).has("name")).toBe(false);
  });

  it("maps id to key when they differ", () => {
    expect(buildIdToKeyMap(properties).get("title")).toBe("productName");
  });

  it("maps scalar rollups to their unique extras key", () => {
    const map = buildIdToKeyMap(properties);
    expect(map.get("minQty")).toBe("variants.quantity_minQty");
    expect(map.get("maxQty")).toBe("variants.quantity_maxQty");
  });

  it("maps display rollups to their plain key", () => {
    expect(buildIdToKeyMap(properties).get("skus")).toBe("variants.sku");
  });
});

describe("resolveFilterKeys", () => {
  it("keeps two calculations on one field distinct", () => {
    const map = buildIdToKeyMap(properties);
    const resolved = resolveFilterKeys(
      [
        {
          and: [
            { property: "minQty", condition: "gt", value: 1 },
            { property: "maxQty", condition: "lt", value: 9 },
          ],
        },
      ],
      map
    );
    expect(resolved).toEqual([
      {
        and: [
          {
            property: "variants.quantity_minQty",
            condition: "gt",
            value: 1,
          },
          {
            property: "variants.quantity_maxQty",
            condition: "lt",
            value: 9,
          },
        ],
      },
    ]);
  });
});
