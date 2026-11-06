import { describe, expect, it } from "vitest";
import type { DataViewProperty } from "../../types/property.type";
import {
  getCardPinIds,
  getPinConfig,
  isCardPin,
  isPinned,
  resolveCardPins,
} from "../resolve-card-pins";

type AnyProperty = DataViewProperty<Record<string, unknown>>;

const prop = (overrides: Record<string, unknown>): AnyProperty =>
  ({ type: "text", ...overrides }) as unknown as AnyProperty;

describe("isPinned / getPinConfig", () => {
  it("treats true and any object as pinned", () => {
    expect(isPinned(prop({ id: "a", pin: true }))).toBe(true);
    expect(isPinned(prop({ id: "a", pin: {} }))).toBe(true);
    expect(isPinned(prop({ id: "a", pin: { hover: true } }))).toBe(true);
  });

  it("treats false and omitted as not pinned", () => {
    expect(isPinned(prop({ id: "a", pin: false }))).toBe(false);
    expect(isPinned(prop({ id: "a" }))).toBe(false);
  });

  it("returns the object form or an empty config", () => {
    expect(getPinConfig(prop({ id: "a", pin: true }))).toEqual({});
    expect(getPinConfig(prop({ id: "a" }))).toEqual({});
    expect(
      getPinConfig(prop({ id: "a", pin: { position: "top-right" } }))
    ).toEqual({ position: "top-right" });
  });
});

describe("isCardPin", () => {
  it("is false for ignored types even when pinned", () => {
    expect(isCardPin(prop({ id: "a", type: "filesMedia", pin: true }))).toBe(
      false
    );
    expect(isCardPin(prop({ id: "a", type: "button", pin: {} }))).toBe(false);
  });

  it("matches resolveCardPins for every other type", () => {
    const pinned = prop({ id: "a", type: "checkbox", pin: true });
    expect(isCardPin(pinned)).toBe(true);
    expect(isCardPin(prop({ id: "b", type: "checkbox" }))).toBe(false);
    expect(getCardPinIds(resolveCardPins([pinned])).has("a")).toBe(true);
  });
});

describe("resolveCardPins", () => {
  it("returns four empty corners when nothing is pinned", () => {
    const pins = resolveCardPins([prop({ id: "a" }), prop({ id: "b" })]);
    expect(pins).toEqual({
      "top-left": [],
      "top-right": [],
      "bottom-left": [],
      "bottom-right": [],
    });
    expect(getCardPinIds(pins).size).toBe(0);
  });

  it("returns empty corners for empty input", () => {
    expect(getCardPinIds(resolveCardPins([])).size).toBe(0);
  });

  it("defaults every type to top-left, always visible", () => {
    const pins = resolveCardPins([
      prop({ id: "flag", type: "checkbox", pin: true }),
      prop({ id: "price", type: "formula", pin: true }),
      prop({ id: "kind", type: "select", pin: true }),
      prop({ id: "when", type: "date", pin: true }),
    ]);
    expect(pins["top-left"].map((pin) => pin.property.id)).toEqual([
      "flag",
      "price",
      "kind",
      "when",
    ]);
    expect(
      pins["top-left"].every(
        (pin) => pin.hover === false && pin.position === "top-left"
      )
    ).toBe(true);
    expect(pins["top-right"]).toHaveLength(0);
    expect(pins["bottom-left"]).toHaveLength(0);
    expect(pins["bottom-right"]).toHaveLength(0);
  });

  it("treats pin: {} exactly like pin: true", () => {
    const asTrue = resolveCardPins([
      prop({ id: "flag", type: "checkbox", pin: true }),
    ]);
    const asEmpty = resolveCardPins([
      prop({ id: "flag", type: "checkbox", pin: {} }),
    ]);
    expect(asEmpty["top-left"][0]).toMatchObject({
      hover: asTrue["top-left"][0]?.hover,
      position: asTrue["top-left"][0]?.position,
    });
  });

  it("honours a full object and fills in defaults for a partial one", () => {
    const pins = resolveCardPins([
      prop({
        id: "condition",
        type: "select",
        pin: { position: "bottom-right", hover: true },
      }),
      prop({ id: "flag", type: "checkbox", pin: { hover: true } }),
      prop({ id: "price", type: "formula", pin: { position: "bottom-left" } }),
    ]);
    expect(pins["bottom-right"][0]).toMatchObject({
      hover: true,
      position: "bottom-right",
    });
    expect(pins["top-left"][0]).toMatchObject({
      hover: true,
      position: "top-left",
    });
    expect(pins["bottom-left"][0]).toMatchObject({
      hover: false,
      position: "bottom-left",
    });
  });

  it("chips plain values and leaves self-styled types bare", () => {
    const pins = resolveCardPins([
      prop({ id: "flag", type: "checkbox", pin: true }),
      prop({ id: "note", type: "text", pin: true }),
      prop({ id: "n", type: "number", pin: true }),
      prop({ id: "when", type: "date", pin: true }),
      prop({ id: "kind", type: "select", pin: true }),
      prop({ id: "tags", type: "multiSelect", pin: true }),
      prop({ id: "state", type: "status", pin: true }),
      prop({ id: "avatar", type: "formula", pin: true }),
      prop({
        id: "variantKinds",
        type: "rollup",
        pin: true,
        config: { type: "select", calculation: "showOriginal" },
      }),
      prop({
        id: "variantCount",
        type: "rollup",
        pin: true,
        config: { type: "number", calculation: "countAll" },
      }),
    ]);
    const byId = Object.fromEntries(
      pins["top-left"].map((pin) => [pin.property.id, pin.chip])
    );
    expect(byId).toEqual({
      flag: true,
      note: true,
      n: true,
      when: true,
      kind: false,
      tags: false,
      state: false,
      avatar: false,
      variantKinds: false,
      variantCount: true,
    });
  });

  it("produces nothing for pin: false or omitted", () => {
    const pins = resolveCardPins([
      prop({ id: "a", pin: false }),
      prop({ id: "b" }),
    ]);
    expect(getCardPinIds(pins).size).toBe(0);
  });

  it("ignores filesMedia and button even when pinned", () => {
    const pins = resolveCardPins([
      prop({ id: "images", type: "filesMedia", pin: true }),
      prop({ id: "open", type: "button", pin: { position: "top-right" } }),
    ]);
    expect(getCardPinIds(pins).size).toBe(0);
  });

  it("keeps declaration order within a corner", () => {
    const pins = resolveCardPins([
      prop({ id: "first", type: "checkbox", pin: { position: "top-right" } }),
      prop({ id: "second", type: "text", pin: { position: "top-right" } }),
      prop({ id: "third", type: "number", pin: { position: "top-right" } }),
    ]);
    expect(pins["top-right"].map((pin) => pin.property.id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("still pins a hidden property (declaration-driven)", () => {
    const pins = resolveCardPins([
      prop({ id: "flag", type: "checkbox", pin: true, hidden: true }),
    ]);
    expect(getCardPinIds(pins).has("flag")).toBe(true);
  });

  it("collects ids across every corner", () => {
    const pins = resolveCardPins([
      prop({ id: "a", type: "checkbox", pin: true }),
      prop({ id: "b", type: "select", pin: { position: "top-right" } }),
      prop({ id: "c", type: "number", pin: { position: "bottom-left" } }),
      prop({ id: "d", type: "date", pin: { position: "bottom-right" } }),
    ]);
    expect([...getCardPinIds(pins)].sort()).toEqual(["a", "b", "c", "d"]);
  });
});
