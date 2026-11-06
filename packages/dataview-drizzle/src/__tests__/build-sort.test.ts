import { describe, expect, it } from "bun:test";
import type { SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { buildCursor, buildSort } from "../build-sort";

const testTable = pgTable("test_item", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price"),
  createdAt: timestamp("created_at"),
});

const fakeDb = drizzle({ connection: { connectionString: "postgres://x" } });

function toSQL(results: SQL[]): string {
  // Compile each SQL fragment via a dummy query
  return results
    .map((r) => fakeDb.select().from(testTable).orderBy(r).toSQL().sql)
    .join(", ");
}

describe("buildSort", () => {
  it("generates ASC with NULLS LAST (user-facing: empty values at bottom)", () => {
    const result = buildSort(testTable, [
      { property: "name", direction: "asc" },
    ]);
    expect(result).toHaveLength(1);
    const s = toSQL(result);
    expect(s).toContain("ASC");
    expect(s).toContain("NULLS LAST");
  });

  it("generates DESC with NULLS LAST (user-facing: empty values at bottom)", () => {
    const result = buildSort(testTable, [
      { property: "price", direction: "desc" },
    ]);
    expect(result).toHaveLength(1);
    const s = toSQL(result);
    expect(s).toContain("DESC");
    expect(s).toContain("NULLS LAST");
  });

  it("skips invalid columns", () => {
    const result = buildSort(testTable, [
      { property: "nonexistent", direction: "asc" },
    ]);
    expect(result).toHaveLength(0);
  });

  it("handles multiple sort fields", () => {
    const result = buildSort(testTable, [
      { property: "price", direction: "desc" },
      { property: "name", direction: "asc" },
    ]);
    expect(result).toHaveLength(2);
  });

  it("reverse flips ASC NULLS LAST to DESC NULLS FIRST", () => {
    // Backward pagination: effective order must be the exact reverse of the
    // user-facing order, which means NULLs (bottom of user order) become the
    // top of the reversed order.
    const result = buildSort(
      testTable,
      [{ property: "name", direction: "asc" }],
      { reverse: true }
    );
    const s = toSQL(result);
    expect(s).toContain("DESC");
    expect(s).toContain("NULLS FIRST");
  });

  it("reverse flips DESC NULLS LAST to ASC NULLS FIRST", () => {
    const result = buildSort(
      testTable,
      [{ property: "price", direction: "desc" }],
      { reverse: true }
    );
    const s = toSQL(result);
    expect(s).toContain("ASC");
    expect(s).toContain("NULLS FIRST");
  });
});

describe("buildCursor", () => {
  it("returns orderBy without cursorWhere when no cursor", () => {
    const result = buildCursor(testTable, {
      sort: [{ property: "name", direction: "asc" }],
    });
    expect(result.orderBy).toHaveLength(1);
    expect(result.cursorWhere).toBeUndefined();
  });

  it("returns orderBy and cursorWhere with cursor", () => {
    const result = buildCursor(testTable, {
      sort: [{ property: "name", direction: "asc" }],
      cursor: "some-id",
      direction: "forward",
    });
    expect(result.orderBy).toHaveLength(1);
    expect(result.cursorWhere).toBeDefined();
  });

  it("reverses orderBy for backward direction", () => {
    const forward = buildCursor(testTable, {
      sort: [{ property: "name", direction: "asc" }],
      direction: "forward",
    });
    const backward = buildCursor(testTable, {
      sort: [{ property: "name", direction: "asc" }],
      direction: "backward",
    });
    const fwdSQL = toSQL(forward.orderBy);
    const bwdSQL = toSQL(backward.orderBy);
    expect(fwdSQL).toContain("ASC");
    expect(bwdSQL).toContain("DESC");
  });

  it("handles null cursor", () => {
    const result = buildCursor(testTable, {
      sort: [{ property: "name", direction: "asc" }],
      cursor: null,
    });
    expect(result.cursorWhere).toBeUndefined();
  });

  it("returns only orderBy when sort has no valid columns", () => {
    const result = buildCursor(testTable, {
      sort: [{ property: "bad", direction: "asc" }],
      cursor: "some-id",
    });
    expect(result.orderBy).toHaveLength(0);
    expect(result.cursorWhere).toBeUndefined();
  });

  it("forward DESC cursor expands NULLs explicitly and uses < comparison", () => {
    // Regression: a tuple comparison `(price, id) < (subq, subq)` returns NULL
    // when any operand is NULL, which empties the next page whenever the
    // cursor row's sort value is NULL or candidates have NULL sort values.
    const result = buildCursor(testTable, {
      sort: [
        { property: "price", direction: "desc" },
        { property: "id", direction: "desc" },
      ],
      cursor: "cursor-id",
      direction: "forward",
    });
    expect(result.cursorWhere).toBeDefined();
    const compiled = fakeDb
      .select()
      .from(testTable)
      .where(result.cursorWhere)
      .toSQL().sql;
    expect(compiled).toContain("IS NULL");
    expect(compiled).toContain("IS NOT NULL");
    expect(compiled).toContain('< (SELECT "price"');
  });

  it("forward ASC cursor flips comparison operator to >", () => {
    const result = buildCursor(testTable, {
      sort: [
        { property: "price", direction: "asc" },
        { property: "id", direction: "asc" },
      ],
      cursor: "cursor-id",
      direction: "forward",
    });
    const compiled = fakeDb
      .select()
      .from(testTable)
      .where(result.cursorWhere)
      .toSQL().sql;
    expect(compiled).toContain("IS NULL");
    expect(compiled).toContain("IS NOT NULL");
    expect(compiled).toContain('> (SELECT "price"');
  });

  it("backward direction inverts the comparison operator", () => {
    // Effective order for backward+ASC is DESC, so `>` flips to `<`.
    const result = buildCursor(testTable, {
      sort: [
        { property: "price", direction: "asc" },
        { property: "id", direction: "asc" },
      ],
      cursor: "cursor-id",
      direction: "backward",
    });
    const compiled = fakeDb
      .select()
      .from(testTable)
      .where(result.cursorWhere)
      .toSQL().sql;
    expect(compiled).toContain('< (SELECT "price"');
  });

  it("gates the predicate on EXISTS so a deleted cursor row returns no rows", () => {
    // Without this gate, `(SELECT col WHERE id=cursor)` returns NULL when the
    // cursor row is missing — indistinguishable from a real NULL column. The
    // backward (NULLS FIRST) branch would then degrade to "every non-NULL
    // row" and return unrelated records. The EXISTS gate short-circuits the
    // whole predicate to false when the cursor row is gone.
    const result = buildCursor(testTable, {
      sort: [{ property: "name", direction: "asc" }],
      cursor: "deleted-id",
      direction: "backward",
    });
    const compiled = fakeDb
      .select()
      .from(testTable)
      .where(result.cursorWhere)
      .toSQL().sql;
    expect(compiled).toContain('EXISTS (SELECT 1 FROM "test_item"');
  });
});
