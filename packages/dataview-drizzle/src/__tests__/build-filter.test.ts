import { describe, expect, it } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { RelationMap } from "../build-filter";
import { buildColumnCondition, buildWhere, getColumn } from "../build-filter";

// ============================================
// Test fixtures: real Drizzle tables + compiler
// ============================================

const parentTable = pgTable("parent", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status"),
  price: integer("price"),
  active: boolean("active"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at"),
});

const childTable = pgTable("child", {
  id: text("id").primaryKey(),
  parentId: text("parent_id").references(() => parentTable.id),
  sku: text("sku"),
  model: text("model"),
  quantity: integer("quantity"),
});

const relations: RelationMap = {
  children: {
    table: childTable,
    foreignKey: "parentId",
  },
};

const fakeDb = drizzle({ connection: { connectionString: "postgres://x" } });

function toSQL(result: ReturnType<typeof buildWhere>): string {
  if (!result) {
    return "";
  }
  return fakeDb.select().from(parentTable).where(result).toSQL().sql;
}

// ============================================
// buildWhere: null/empty input
// ============================================

describe("buildWhere", () => {
  it("returns undefined for null filter", () => {
    expect(buildWhere(parentTable, null)).toBeUndefined();
  });

  it("returns undefined for empty filter array", () => {
    expect(buildWhere(parentTable, [])).toBeUndefined();
  });

  it("returns undefined for undefined filter", () => {
    expect(buildWhere(parentTable, undefined)).toBeUndefined();
  });

  // ============================================
  // Primary table: text conditions
  // ============================================

  describe("text conditions", () => {
    it("iLike generates ILIKE with wildcards", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "iLike", value: "test" },
      ]);
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("ILIKE");
    });

    it("notILike generates NOT ILIKE with wildcards", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "notILike", value: "test" },
      ]);
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("NOT ILIKE");
    });

    it("startsWith generates ILIKE with suffix wildcard", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "startsWith", value: "abc" },
      ]);
      const s = toSQL(result);
      expect(s).toContain("ILIKE");
      // Should not have leading %
    });

    it("endsWith generates ILIKE with prefix wildcard", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "endsWith", value: "xyz" },
      ]);
      const s = toSQL(result);
      expect(s).toContain("ILIKE");
    });

    it("iLike coerces non-string value to string", () => {
      const col = getColumn(parentTable, "name");
      expect(buildColumnCondition(col, "iLike", 123)).toBeDefined();
    });

    it("iLike returns undefined for null value", () => {
      const col = getColumn(parentTable, "name");
      expect(buildColumnCondition(col, "iLike", null)).toBeUndefined();
    });

    it("startsWithNonAlpha generates condition without value", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "startsWithNonAlpha" },
      ]);
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s.toLowerCase()).toContain("is null");
    });
  });

  // ============================================
  // Primary table: equality conditions
  // ============================================

  describe("equality conditions", () => {
    it("eq generates equality", () => {
      const result = buildWhere(parentTable, [
        { property: "status", condition: "eq", value: "active" },
      ]);
      expect(result).toBeDefined();
    });

    it("ne generates not-equal", () => {
      const result = buildWhere(parentTable, [
        { property: "status", condition: "ne", value: "archived" },
      ]);
      expect(result).toBeDefined();
    });

    it("eq with date-only string generates range", () => {
      const result = buildWhere(parentTable, [
        { property: "createdAt", condition: "eq", value: "2024-01-15" },
      ]);
      expect(result).toBeDefined();
      // Should generate >= midnight AND < next midnight
    });

    it("eq with boolean column accepts boolean value", () => {
      const result = buildWhere(parentTable, [
        { property: "active", condition: "eq", value: true },
      ]);
      expect(result).toBeDefined();
    });

    it("eq with boolean column throws on non-boolean value", () => {
      expect(() => {
        buildWhere(parentTable, [
          { property: "active", condition: "eq", value: "yes" },
        ]);
      }).toThrow("Expected boolean value");
    });
  });

  // ============================================
  // Primary table: comparison conditions
  // ============================================

  describe("comparison conditions", () => {
    it("lt generates less-than", () => {
      const result = buildWhere(parentTable, [
        { property: "price", condition: "lt", value: 100 },
      ]);
      expect(result).toBeDefined();
    });

    it("lte generates less-than-or-equal", () => {
      const result = buildWhere(parentTable, [
        { property: "price", condition: "lte", value: 100 },
      ]);
      expect(result).toBeDefined();
    });

    it("gt generates greater-than", () => {
      const result = buildWhere(parentTable, [
        { property: "price", condition: "gt", value: 50 },
      ]);
      expect(result).toBeDefined();
    });

    it("gte generates greater-than-or-equal", () => {
      const result = buildWhere(parentTable, [
        { property: "price", condition: "gte", value: 50 },
      ]);
      expect(result).toBeDefined();
    });

    it("lt with date-only uses midnight", () => {
      const result = buildWhere(parentTable, [
        { property: "createdAt", condition: "lt", value: "2024-01-15" },
      ]);
      expect(result).toBeDefined();
    });

    it("gt with date-only uses next midnight", () => {
      const result = buildWhere(parentTable, [
        { property: "createdAt", condition: "gt", value: "2024-01-15" },
      ]);
      expect(result).toBeDefined();
    });
  });

  // ============================================
  // Primary table: array conditions
  // ============================================

  describe("array conditions", () => {
    it("inArray generates IN", () => {
      const result = buildWhere(parentTable, [
        { property: "status", condition: "inArray", value: ["a", "b"] },
      ]);
      expect(result).toBeDefined();
    });

    it("notInArray generates NOT IN", () => {
      const result = buildWhere(parentTable, [
        { property: "status", condition: "notInArray", value: ["a", "b"] },
      ]);
      expect(result).toBeDefined();
    });

    it("inArray returns undefined for empty array", () => {
      const col = getColumn(parentTable, "status");
      expect(buildColumnCondition(col, "inArray", [])).toBeUndefined();
    });

    it("notInArray returns undefined for empty array", () => {
      const col = getColumn(parentTable, "status");
      expect(buildColumnCondition(col, "notInArray", [])).toBeUndefined();
    });

    it("inArray on array column generates overlap operator", () => {
      const result = buildWhere(parentTable, [
        { property: "tags", condition: "inArray", value: ["tag1", "tag2"] },
      ]);
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("&&");
    });
  });

  // ============================================
  // Primary table: range/between
  // ============================================

  describe("isBetween", () => {
    it("generates range condition with both bounds", () => {
      const result = buildWhere(parentTable, [
        { property: "price", condition: "isBetween", value: [10, 100] },
      ]);
      expect(result).toBeDefined();
    });

    it("generates gte only when min is provided", () => {
      const result = buildWhere(parentTable, [
        { property: "price", condition: "isBetween", value: [10, null] },
      ]);
      expect(result).toBeDefined();
    });

    it("generates lte only when max is provided", () => {
      const result = buildWhere(parentTable, [
        { property: "price", condition: "isBetween", value: [null, 100] },
      ]);
      expect(result).toBeDefined();
    });

    it("returns undefined for non-array value", () => {
      const col = getColumn(parentTable, "price");
      expect(buildColumnCondition(col, "isBetween", "bad")).toBeUndefined();
    });

    it("handles date-only strings in range", () => {
      const result = buildWhere(parentTable, [
        {
          property: "createdAt",
          condition: "isBetween",
          value: ["2024-01-01", "2024-01-31"],
        },
      ]);
      expect(result).toBeDefined();
    });
  });

  // ============================================
  // Primary table: empty conditions
  // ============================================

  describe("empty conditions", () => {
    it("isEmpty on text column checks null OR empty string", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "isEmpty" },
      ]);
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("is null");
    });

    it("isNotEmpty on text column checks not null AND not empty", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "isNotEmpty" },
      ]);
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("is not null");
    });

    it("isEmpty on array column checks null OR empty array", () => {
      const result = buildWhere(parentTable, [
        { property: "tags", condition: "isEmpty" },
      ]);
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("is null");
    });

    it("isEmpty on non-text column checks null only", () => {
      const result = buildWhere(parentTable, [
        { property: "price", condition: "isEmpty" },
      ]);
      expect(result).toBeDefined();
    });
  });

  // ============================================
  // Draft filter skipping
  // ============================================

  describe("draft filter skipping", () => {
    it("skips rules with empty string value", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "iLike", value: "" },
      ]);
      expect(result).toBeUndefined();
    });

    it("skips rules with null value", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "eq", value: null },
      ]);
      expect(result).toBeUndefined();
    });

    it("skips rules with undefined value", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "eq", value: undefined },
      ]);
      expect(result).toBeUndefined();
    });

    it("does not skip isEmpty (no value needed)", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "isEmpty" },
      ]);
      expect(result).toBeDefined();
    });

    it("does not skip isNotEmpty (no value needed)", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "isNotEmpty" },
      ]);
      expect(result).toBeDefined();
    });

    it("does not skip startsWithNonAlpha (no value needed)", () => {
      const result = buildWhere(parentTable, [
        { property: "name", condition: "startsWithNonAlpha" },
      ]);
      expect(result).toBeDefined();
    });

    it("skips rules with empty array value", () => {
      const result = buildWhere(parentTable, [
        { property: "status", condition: "inArray", value: [] },
      ]);
      expect(result).toBeUndefined();
    });
  });

  // ============================================
  // Nested AND/OR expressions
  // ============================================

  describe("nested expressions", () => {
    it("handles OR expression", () => {
      const result = buildWhere(parentTable, [
        {
          or: [
            { property: "status", condition: "eq", value: "active" },
            { property: "status", condition: "eq", value: "pending" },
          ],
        },
      ]);
      expect(result).toBeDefined();
    });

    it("handles AND expression", () => {
      const result = buildWhere(parentTable, [
        {
          and: [
            { property: "status", condition: "eq", value: "active" },
            { property: "price", condition: "gt", value: 100 },
          ],
        },
      ]);
      expect(result).toBeDefined();
    });

    it("handles nested OR within AND", () => {
      const result = buildWhere(parentTable, [
        { property: "price", condition: "gt", value: 0 },
        {
          or: [
            { property: "status", condition: "eq", value: "a" },
            { property: "status", condition: "eq", value: "b" },
          ],
        },
      ]);
      expect(result).toBeDefined();
    });

    it("skips expression where all children are drafts", () => {
      const result = buildWhere(parentTable, [
        {
          or: [
            { property: "name", condition: "iLike", value: "" },
            { property: "name", condition: "iLike", value: "" },
          ],
        },
      ]);
      expect(result).toBeUndefined();
    });
  });

  // ============================================
  // Unknown column / property
  // ============================================

  describe("unknown properties", () => {
    it("skips filter on non-existent column", () => {
      const result = buildWhere(parentTable, [
        { property: "nonexistent", condition: "eq", value: "x" },
      ]);
      expect(result).toBeUndefined();
    });

    it("skips dot-notation property without relations map", () => {
      const result = buildWhere(parentTable, [
        { property: "children.sku", condition: "iLike", value: "test" },
      ]);
      expect(result).toBeUndefined();
    });
  });

  // ============================================
  // Relation filters
  // ============================================

  describe("relation filters", () => {
    it("positive iLike generates EXISTS", () => {
      const result = buildWhere(
        parentTable,
        [{ property: "children.sku", condition: "iLike", value: "ABC" }],
        relations
      );
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("EXISTS");
      expect(s).not.toContain("NOT EXISTS");
    });

    it("negative notILike generates NOT EXISTS with positive condition", () => {
      const result = buildWhere(
        parentTable,
        [{ property: "children.sku", condition: "notILike", value: "ABC" }],
        relations
      );
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("NOT EXISTS");
    });

    it("negative ne generates NOT EXISTS with eq condition", () => {
      const result = buildWhere(
        parentTable,
        [{ property: "children.sku", condition: "ne", value: "X" }],
        relations
      );
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("NOT EXISTS");
    });

    it("negative notInArray generates NOT EXISTS with inArray", () => {
      const result = buildWhere(
        parentTable,
        [
          {
            property: "children.sku",
            condition: "notInArray",
            value: ["A", "B"],
          },
        ],
        relations
      );
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("NOT EXISTS");
    });

    it("negative isEmpty generates NOT EXISTS with isNotEmpty", () => {
      const result = buildWhere(
        parentTable,
        [{ property: "children.sku", condition: "isEmpty" }],
        relations
      );
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("NOT EXISTS");
    });

    it("positive eq generates EXISTS", () => {
      const result = buildWhere(
        parentTable,
        [{ property: "children.quantity", condition: "gt", value: 5 }],
        relations
      );
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("EXISTS");
      expect(s).not.toContain("NOT EXISTS");
    });

    it("returns undefined for unknown relation name", () => {
      const result = buildWhere(
        parentTable,
        [{ property: "unknown.field", condition: "eq", value: "x" }],
        relations
      );
      expect(result).toBeUndefined();
    });

    it("returns undefined for unknown field on related table", () => {
      const result = buildWhere(
        parentTable,
        [{ property: "children.nonexistent", condition: "eq", value: "x" }],
        relations
      );
      expect(result).toBeUndefined();
    });

    it("skips draft relation filter", () => {
      const result = buildWhere(
        parentTable,
        [{ property: "children.sku", condition: "iLike", value: "" }],
        relations
      );
      expect(result).toBeUndefined();
    });

    it("combines primary and relation filters with AND", () => {
      const result = buildWhere(
        parentTable,
        [
          { property: "status", condition: "eq", value: "active" },
          { property: "children.sku", condition: "iLike", value: "ABC" },
        ],
        relations
      );
      expect(result).toBeDefined();
      const s = toSQL(result);
      expect(s).toContain("EXISTS");
    });

    it("multiple relation filters combined with AND", () => {
      const result = buildWhere(
        parentTable,
        [
          { property: "children.sku", condition: "iLike", value: "ABC" },
          { property: "children.model", condition: "eq", value: "X100" },
        ],
        relations
      );
      expect(result).toBeDefined();
      const s = toSQL(result);
      // Should have two EXISTS
      const matches = s.match(/EXISTS/g);
      expect(matches?.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================
  // Unknown condition
  // ============================================

  it("returns undefined for unknown condition type", () => {
    const col = getColumn(parentTable, "name");
    expect(
      buildColumnCondition(col, "unknownOp" as never, "val")
    ).toBeUndefined();
  });
});
