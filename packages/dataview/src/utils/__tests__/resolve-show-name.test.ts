import { describe, expect, it } from "vitest";
import {
  getShowNameValueClasses,
  getShowNameWrapperClasses,
  resolveShowName,
} from "../resolve-show-name";

describe("resolveShowName", () => {
  it("returns null when hidden", () => {
    expect(resolveShowName(false, true)).toBeNull();
    expect(resolveShowName(undefined, false)).toBeNull();
  });

  it("falls back to the view default when undefined", () => {
    expect(resolveShowName(undefined, true)).toEqual({
      layout: "vertical",
      align: "end",
    });
  });

  it("treats true and {} as vertical", () => {
    expect(resolveShowName(true, false)).toEqual({
      layout: "vertical",
      align: "end",
    });
    expect(resolveShowName({}, false)).toEqual({
      layout: "vertical",
      align: "end",
    });
  });

  it("honours an explicit config and fills defaults", () => {
    expect(resolveShowName({ layout: "horizontal" }, false)).toEqual({
      layout: "horizontal",
      align: "end",
    });
    expect(
      resolveShowName({ layout: "horizontal", align: "start" }, false)
    ).toEqual({ layout: "horizontal", align: "start" });
  });

  it("a config object wins over a false view default", () => {
    expect(resolveShowName({ layout: "horizontal" }, false)).not.toBeNull();
  });
});

describe("getShowNameValueClasses", () => {
  it("renders the value bare when vertical or hidden", () => {
    expect(getShowNameValueClasses(null)).toBeNull();
    expect(
      getShowNameValueClasses({ layout: "vertical", align: "end" })
    ).toBeNull();
  });

  it("right-aligns and fills for end, stays compact for start", () => {
    expect(
      getShowNameValueClasses({ layout: "horizontal", align: "end" })
    ).toContain("text-right");
    expect(
      getShowNameValueClasses({ layout: "horizontal", align: "start" })
    ).not.toContain("text-right");
  });
});

describe("getShowNameWrapperClasses", () => {
  it("stacks by default", () => {
    expect(getShowNameWrapperClasses(null)).toContain("flex-col");
    expect(
      getShowNameWrapperClasses({ layout: "vertical", align: "end" })
    ).toContain("flex-col");
  });

  it("lays out horizontally with the requested alignment", () => {
    expect(
      getShowNameWrapperClasses({ layout: "horizontal", align: "end" })
    ).toContain("justify-between");
    const start = getShowNameWrapperClasses({
      layout: "horizontal",
      align: "start",
    });
    expect(start).not.toContain("justify-between");
    expect(start).not.toContain("flex-col");
  });
});
