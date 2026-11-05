import { describe, expect, it } from "vitest";
import { rowId } from "../row-id";

describe("rowId", () => {
  it("keys a row by its id, string or number", () => {
    expect(rowId({ id: 12 }, 0)).toBe("12");
    expect(rowId({ id: "abc" }, 3)).toBe("abc");
  });

  it("falls back to the index without a usable id", () => {
    expect(rowId({}, 4)).toBe("4");
    expect(rowId({ id: null }, 5)).toBe("5");
    expect(rowId({ id: { nested: true } }, 6)).toBe("6");
    expect(rowId(null, 7)).toBe("7");
  });
});
