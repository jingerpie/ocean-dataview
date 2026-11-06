import { describe, expect, it } from "vitest";
import { buildSearchFilter } from "../build-search";

describe("buildSearchFilter", () => {
  it("returns null for empty search string", () => {
    expect(buildSearchFilter("", ["name", "title"])).toBeNull();
  });

  it("returns null for whitespace-only search string", () => {
    expect(buildSearchFilter("   ", ["name"])).toBeNull();
  });

  it("returns null for empty searchFields array", () => {
    expect(buildSearchFilter("test", [])).toBeNull();
  });

  it("returns null for empty search AND empty fields", () => {
    expect(buildSearchFilter("", [])).toBeNull();
  });

  it("generates OR clause with iLike rules for each field", () => {
    const result = buildSearchFilter("hello", ["name", "title"]);
    expect(result).not.toBeNull();
    expect(result?.or).toHaveLength(2);
    expect(result?.or[0]).toEqual({
      property: "name",
      condition: "iLike",
      value: "hello",
    });
    expect(result?.or[1]).toEqual({
      property: "title",
      condition: "iLike",
      value: "hello",
    });
  });

  it("trims search string", () => {
    const result = buildSearchFilter("  hello  ", ["name"]);
    expect(result?.or[0]?.value).toBe("hello");
  });

  it("generates single rule for single field", () => {
    const result = buildSearchFilter("test", ["sku"]);
    expect(result?.or).toHaveLength(1);
    expect(result?.or[0]?.property).toBe("sku");
  });

  it("works with dot-notation field keys (relation search)", () => {
    const result = buildSearchFilter("ABC", ["name", "productVariants.sku"]);
    expect(result?.or).toHaveLength(2);
    expect(result?.or[1]?.property).toBe("productVariants.sku");
    expect(result?.or[1]?.condition).toBe("iLike");
    expect(result?.or[1]?.value).toBe("ABC");
  });
});
