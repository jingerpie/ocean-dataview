import { describe, expect, it } from "vitest";
import { buildGroupItems, getGroupOptions } from "../build-group-items";

const counts = {
  b: { count: 2, hasMore: false },
  a: { count: 0, hasMore: false },
  c: { count: 99, hasMore: true },
};

describe("buildGroupItems", () => {
  it("returns an empty list without counts", () => {
    expect(buildGroupItems(undefined, {})).toEqual([]);
  });

  it("sorts by key ascending by default", () => {
    expect(buildGroupItems(counts, {}).map((g) => g.key)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("sorts numeric sort values numerically and honours desc", () => {
    const groups = buildGroupItems(counts, {
      sortOrder: "desc",
      sortValues: { a: 10, b: 2, c: 1 },
    });
    expect(groups.map((g) => g.key)).toEqual(["a", "b", "c"]);
  });

  it("hides empty groups and caps display counts", () => {
    const groups = buildGroupItems(counts, { hideEmpty: true });
    expect(groups.map((g) => [g.key, g.displayCount])).toEqual([
      ["b", "2"],
      ["c", "99+"],
    ]);
  });
});

describe("getGroupOptions", () => {
  it("flattens status groups with the group colour", () => {
    expect(
      getGroupOptions({
        id: "status",
        type: "status",
        config: {
          groups: [
            { color: "green", label: "Done", options: ["shipped", "closed"] },
          ],
        },
      } as never)
    ).toEqual([
      { value: "shipped", color: "green" },
      { value: "closed", color: "green" },
    ]);
  });
});
