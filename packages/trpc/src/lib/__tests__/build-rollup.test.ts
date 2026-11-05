import { describe, expect, it } from "bun:test";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import type { RelationConfig, RelationMap } from "../build-filter";
import { buildWhere } from "../build-filter";
import {
  buildRollupExtras,
  buildRollupSubquery,
  buildScalarRollupCondition,
  flattenRelationArrays,
} from "../build-rollup";

// ============================================
// Test fixtures
// ============================================

const parentTable = pgTable("parent", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

const childTable = pgTable("child", {
  id: text("id").primaryKey(),
  parentId: text("parent_id").references(() => parentTable.id),
  sku: text("sku"),
  quantity: integer("quantity"),
  model: text("model"),
});

const childrenRelation: RelationConfig = {
  table: childTable,
  foreignKey: "parentId",
};

const relations: RelationMap = {
  children: childrenRelation,
};

const fakeDb = drizzle({ connection: { connectionString: "postgres://x" } });

function subqueryToSQL(
  subquery: ReturnType<typeof buildRollupSubquery>
): string {
  // Wrap subquery in a SELECT to get valid SQL
  return fakeDb.select().from(parentTable).where(subquery).toSQL().sql;
}

function filterToSQL(result: ReturnType<typeof buildWhere>): string {
  if (!result) {
    return "";
  }
  return fakeDb.select().from(parentTable).where(result).toSQL().sql;
}

// ============================================
// buildRollupSubquery
// ============================================

describe("buildRollupSubquery", () => {
  it("generates COUNT(*) for countAll", () => {
    const subquery = buildRollupSubquery(parentTable, childrenRelation, {
      field: "sku",
      calculation: "countAll",
    });
    const s = subqueryToSQL(subquery);
    expect(s).toContain("COUNT(*)");
    expect(s).toContain('"child"');
    expect(s).toContain('"parent_id"');
  });

  it("generates SUM for sum calculation", () => {
    const subquery = buildRollupSubquery(parentTable, childrenRelation, {
      field: "quantity",
      calculation: "sum",
    });
    const s = subqueryToSQL(subquery);
    expect(s).toContain("SUM(");
    expect(s).toContain('"quantity"');
  });

  it("generates AVG for average calculation", () => {
    const subquery = buildRollupSubquery(parentTable, childrenRelation, {
      field: "quantity",
      calculation: "average",
    });
    const s = subqueryToSQL(subquery);
    expect(s).toContain("AVG(");
  });

  it("generates COUNT(DISTINCT) for countUnique", () => {
    const subquery = buildRollupSubquery(parentTable, childrenRelation, {
      field: "sku",
      calculation: "countUnique",
    });
    const s = subqueryToSQL(subquery);
    expect(s).toContain("COUNT(DISTINCT");
  });

  it("generates MIN for min calculation", () => {
    const subquery = buildRollupSubquery(parentTable, childrenRelation, {
      field: "quantity",
      calculation: "min",
    });
    const s = subqueryToSQL(subquery);
    expect(s).toContain("MIN(");
  });

  it("generates MAX for max calculation", () => {
    const subquery = buildRollupSubquery(parentTable, childrenRelation, {
      field: "quantity",
      calculation: "max",
    });
    const s = subqueryToSQL(subquery);
    expect(s).toContain("MAX(");
  });

  it("generates MAX - MIN for range calculation", () => {
    const subquery = buildRollupSubquery(parentTable, childrenRelation, {
      field: "quantity",
      calculation: "range",
    });
    const s = subqueryToSQL(subquery);
    expect(s).toContain("MAX(");
    expect(s).toContain("MIN(");
  });

  it("generates PERCENTILE_CONT for median", () => {
    const subquery = buildRollupSubquery(parentTable, childrenRelation, {
      field: "quantity",
      calculation: "median",
    });
    const s = subqueryToSQL(subquery);
    expect(s).toContain("PERCENTILE_CONT");
  });

  it("generates percent calculations", () => {
    const subquery = buildRollupSubquery(parentTable, childrenRelation, {
      field: "sku",
      calculation: "percentEmpty",
    });
    const s = subqueryToSQL(subquery);
    expect(s).toContain("COUNT(*)");
    expect(s).toContain("100");
  });
});

// ============================================
// buildScalarRollupCondition
// ============================================

describe("buildScalarRollupCondition", () => {
  it("generates subquery > value for gt condition", () => {
    const result = buildScalarRollupCondition(
      parentTable,
      { property: "children.sku", condition: "gt", value: 5 },
      childrenRelation,
      { field: "sku", calculation: "countAll" }
    );
    if (!result) {
      throw new Error("Expected result");
    }
    const s = fakeDb.select().from(parentTable).where(result).toSQL().sql;
    expect(s).toContain("COUNT(*)");
    expect(s).toContain("> $");
  });

  it("generates subquery = value for eq condition", () => {
    const result = buildScalarRollupCondition(
      parentTable,
      { property: "children.quantity", condition: "eq", value: 100 },
      childrenRelation,
      { field: "quantity", calculation: "sum" }
    );
    if (!result) {
      throw new Error("Expected result");
    }
    const s = fakeDb.select().from(parentTable).where(result).toSQL().sql;
    expect(s).toContain("SUM(");
    expect(s).toContain("= $");
  });

  it("returns undefined for draft filter (empty value)", () => {
    const result = buildScalarRollupCondition(
      parentTable,
      { property: "children.sku", condition: "gt", value: "" },
      childrenRelation,
      { field: "sku", calculation: "countAll" }
    );
    expect(result).toBeUndefined();
  });

  it("generates IS NULL for isEmpty", () => {
    const result = buildScalarRollupCondition(
      parentTable,
      { property: "children.sku", condition: "isEmpty", value: null },
      childrenRelation,
      { field: "sku", calculation: "countAll" }
    );
    if (!result) {
      throw new Error("Expected result");
    }
    const s = fakeDb.select().from(parentTable).where(result).toSQL().sql;
    expect(s).toContain("IS NULL");
  });
});

// ============================================
// buildWhere with scalar rollups
// ============================================

describe("buildWhere with scalar rollups", () => {
  it("routes scalar rollup to subquery condition instead of EXISTS", () => {
    const result = buildWhere(
      parentTable,
      [{ property: "children.sku", condition: "gt", value: 3 }],
      relations,
      [
        {
          extrasKey: "children.sku",
          key: "children.sku",
          calculation: "countAll",
        },
      ]
    );
    expect(result).toBeDefined();
    const s = filterToSQL(result);
    // Should use subquery aggregate, NOT EXISTS
    expect(s).toContain("COUNT(*)");
    expect(s).not.toContain("EXISTS");
  });

  it("matches scalar rollup by extrasKey when several calculations share a field", () => {
    const rollups = [
      {
        extrasKey: "children.quantity_minQty",
        key: "children.quantity",
        calculation: "min",
      },
      {
        extrasKey: "children.quantity_maxQty",
        key: "children.quantity",
        calculation: "max",
      },
    ];
    const max = filterToSQL(
      buildWhere(
        parentTable,
        [
          {
            property: "children.quantity_maxQty",
            condition: "gt",
            value: 3,
          },
        ],
        relations,
        rollups
      )
    );
    expect(max).toContain("MAX(");
    expect(max).not.toContain("MIN(");
    expect(max).toContain('"quantity"');

    const min = filterToSQL(
      buildWhere(
        parentTable,
        [
          {
            property: "children.quantity_minQty",
            condition: "gt",
            value: 3,
          },
        ],
        relations,
        rollups
      )
    );
    expect(min).toContain("MIN(");
    expect(min).not.toContain("MAX(");
  });

  it("falls back to matching scalar rollup by plain key", () => {
    const s = filterToSQL(
      buildWhere(
        parentTable,
        [{ property: "children.quantity", condition: "gt", value: 3 }],
        relations,
        [
          {
            extrasKey: "children.quantity_total",
            key: "children.quantity",
            calculation: "sum",
          },
        ]
      )
    );
    expect(s).toContain("SUM(");
    expect(s).not.toContain("EXISTS");
  });

  it("falls through to EXISTS for non-rollup relation property", () => {
    // children.model is NOT in rollups, so it should use EXISTS
    const result = buildWhere(
      parentTable,
      [{ property: "children.model", condition: "iLike", value: "test" }],
      relations,
      [
        {
          extrasKey: "children.sku",
          key: "children.sku",
          calculation: "countAll",
        },
      ]
    );
    expect(result).toBeDefined();
    const s = filterToSQL(result);
    expect(s).toContain("EXISTS");
  });
});

// ============================================
// buildRollupExtras
// ============================================

describe("buildRollupExtras", () => {
  it("returns a function", () => {
    const extrasFn = buildRollupExtras(relations, [
      {
        extrasKey: "children.sku",
        key: "children.sku",
        calculation: "countAll",
      },
    ]);
    expect(typeof extrasFn).toBe("function");
  });

  it("generates extras keyed by extrasKey", () => {
    const extrasFn = buildRollupExtras(relations, [
      {
        extrasKey: "children.sku",
        key: "children.sku",
        calculation: "countAll",
      },
      {
        extrasKey: "children.quantity",
        key: "children.quantity",
        calculation: "sum",
      },
    ]);

    const fields = {
      id: parentTable.id,
      name: parentTable.name,
    };
    const result = extrasFn(fields, { sql });

    expect(result).toHaveProperty(["children.sku"]);
    expect(result).toHaveProperty(["children.quantity"]);
  });

  it("supports duplicate keys with different extrasKeys", () => {
    const extrasFn = buildRollupExtras(relations, [
      {
        extrasKey: "children.quantity_minQty",
        key: "children.quantity",
        calculation: "min",
      },
      {
        extrasKey: "children.quantity_maxQty",
        key: "children.quantity",
        calculation: "max",
      },
    ]);

    const fields = { id: parentTable.id };
    const result = extrasFn(fields, { sql });

    expect(result).toHaveProperty(["children.quantity_minQty"]);
    expect(result).toHaveProperty(["children.quantity_maxQty"]);
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("skips rollups with invalid relation names", () => {
    const extrasFn = buildRollupExtras(relations, [
      {
        extrasKey: "nonexistent.field",
        key: "nonexistent.field",
        calculation: "countAll",
      },
    ]);

    const fields = { id: parentTable.id };
    const result = extrasFn(fields, { sql });

    expect(Object.keys(result)).toHaveLength(0);
  });

  it("skips rollups without dot-notation key", () => {
    const extrasFn = buildRollupExtras(relations, [
      { extrasKey: "noDotKey", key: "noDotKey", calculation: "countAll" },
    ]);

    const fields = { id: parentTable.id };
    const result = extrasFn(fields, { sql });

    expect(Object.keys(result)).toHaveLength(0);
  });
});

// ============================================
// Display rollup: flattenRelationArrays
// ============================================

describe("flattenRelationArrays", () => {
  it("replaces relation array with object-of-arrays", () => {
    const items = [
      {
        id: "1",
        productVariants: [
          { sku: "A", price: 1999 },
          { sku: "B", price: 2499 },
        ],
      },
    ];
    flattenRelationArrays(items, ["productVariants"]);

    const raw = items[0] as Record<string, unknown>;
    const variants = raw.productVariants as Record<string, unknown[]>;
    expect(variants.sku).toEqual(["A", "B"]);
    expect(variants.price).toEqual([1999, 2499]);
  });

  it("preserves null and empty string values to keep per-row alignment", () => {
    const items = [
      {
        id: "1",
        children: [
          { sku: "A", model: null },
          { sku: "", model: "X" },
          { sku: "B", model: "" },
        ],
      },
    ];
    flattenRelationArrays(items, ["children"]);

    const raw = items[0] as Record<string, unknown>;
    const children = raw.children as Record<string, unknown[]>;
    expect(children.sku).toEqual(["A", "", "B"]);
    expect(children.model).toEqual([null, "X", ""]);
  });

  it("handles empty relation arrays gracefully", () => {
    const items = [{ id: "1", productVariants: [] }];
    flattenRelationArrays(items, ["productVariants"]);

    // Empty array is left as-is (not replaced)
    expect(items[0]?.productVariants).toEqual([]);
  });

  it("handles missing relation key gracefully", () => {
    const items = [{ id: "1" }];
    flattenRelationArrays(items, ["productVariants"]);

    const raw = items[0] as Record<string, unknown>;
    expect(raw.productVariants).toBeUndefined();
  });

  it("flattens multiple relations", () => {
    const items = [
      {
        id: "1",
        productVariants: [{ sku: "A" }],
        orderLines: [{ title: "Widget" }],
      },
    ];
    flattenRelationArrays(items, ["productVariants", "orderLines"]);

    const raw = items[0] as Record<string, unknown>;
    const variants = raw.productVariants as Record<string, unknown[]>;
    const orders = raw.orderLines as Record<string, unknown[]>;
    expect(variants.sku).toEqual(["A"]);
    expect(orders.title).toEqual(["Widget"]);
  });
});

// ============================================
// Array quantifier filters (any / none / every)
// ============================================

describe("buildWhere with quantifier", () => {
  it('generates EXISTS for "any" quantifier', () => {
    const result = buildWhere(
      parentTable,
      [
        {
          property: "children.sku",
          condition: "iLike",
          value: "ABC",
          quantifier: "any",
        },
      ],
      relations
    );
    expect(result).toBeDefined();
    const s = filterToSQL(result);
    expect(s).toContain("EXISTS");
    expect(s).not.toContain("NOT EXISTS");
    expect(s).toContain("ILIKE");
  });

  it('generates NOT EXISTS for "none" quantifier', () => {
    const result = buildWhere(
      parentTable,
      [
        {
          property: "children.sku",
          condition: "iLike",
          value: "ABC",
          quantifier: "none",
        },
      ],
      relations
    );
    expect(result).toBeDefined();
    const s = filterToSQL(result);
    expect(s).toContain("NOT EXISTS");
    expect(s).toContain("ILIKE");
  });

  it('generates NOT EXISTS with IS NOT TRUE for "every" quantifier', () => {
    const result = buildWhere(
      parentTable,
      [
        {
          property: "children.sku",
          condition: "iLike",
          value: "ABC",
          quantifier: "every",
        },
      ],
      relations
    );
    expect(result).toBeDefined();
    const s = filterToSQL(result);
    expect(s).toContain("NOT EXISTS");
    expect(s).toContain("IS NOT TRUE");
    expect(s).toContain("ILIKE");
  });

  it('"every" requires at least one related row (empty relation does not match)', () => {
    const result = buildWhere(
      parentTable,
      [
        {
          property: "children.sku",
          condition: "iLike",
          value: "ABC",
          quantifier: "every",
        },
      ],
      relations
    );
    const s = filterToSQL(result);
    // Leading EXISTS guard, then the NOT EXISTS violation check
    expect(s).toContain(
      'where (EXISTS (SELECT 1 FROM "child" WHERE "child"."parent_id" = "parent"."id") AND NOT EXISTS'
    );
  });

  it('"every" stays grouped when combined with OR', () => {
    const result = buildWhere(
      parentTable,
      [
        {
          or: [
            { property: "name", condition: "eq", value: "x" },
            {
              property: "children.sku",
              condition: "eq",
              value: "A",
              quantifier: "every",
            },
          ],
        },
      ],
      relations
    );
    const s = filterToSQL(result);
    expect(s).toContain(' or (EXISTS (SELECT 1 FROM "child"');
  });

  it('"every" counts NULL child values as violations', () => {
    const result = buildWhere(
      parentTable,
      [
        {
          property: "children.quantity",
          condition: "gt",
          value: 5,
          quantifier: "every",
        },
      ],
      relations
    );
    const s = filterToSQL(result);
    // NOT (quantity > 5) is NULL for a NULL quantity and would not count as
    // a violation; IS NOT TRUE treats it as one.
    expect(s).toContain("IS NOT TRUE");
    expect(s).not.toContain("NOT (");
  });

  it("skips draft filters with quantifier", () => {
    const result = buildWhere(
      parentTable,
      [
        {
          property: "children.sku",
          condition: "iLike",
          value: "",
          quantifier: "any",
        },
      ],
      relations
    );
    expect(result).toBeUndefined();
  });

  it("falls back to NEGATIVE_TO_POSITIVE when no quantifier set", () => {
    // notILike without quantifier should use NOT EXISTS with iLike (inverted)
    const result = buildWhere(
      parentTable,
      [
        {
          property: "children.sku",
          condition: "notILike",
          value: "ABC",
        },
      ],
      relations
    );
    expect(result).toBeDefined();
    const s = filterToSQL(result);
    expect(s).toContain("NOT EXISTS");
    // Should contain the positive (inverted) condition: ILIKE, not NOT ILIKE
    expect(s).toContain("ILIKE");
    expect(s).not.toContain("NOT ILIKE");
  });

  it('"every" with eq condition checks IS NOT TRUE', () => {
    const result = buildWhere(
      parentTable,
      [
        {
          property: "children.sku",
          condition: "eq",
          value: "test",
          quantifier: "every",
        },
      ],
      relations
    );
    expect(result).toBeDefined();
    const s = filterToSQL(result);
    expect(s).toContain("NOT EXISTS");
    expect(s).toContain("IS NOT TRUE");
  });
});
