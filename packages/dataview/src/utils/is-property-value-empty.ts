import type {
  DataViewProperty,
  PropertyRenderFunction,
  RollupConfig,
} from "../types/property.type";

const NOOP_RENDER: PropertyRenderFunction = () => null;

/**
 * Returns true when a property's raw value should render nothing.
 * Mirrors the falsy checks each property component performs internally,
 * so consumers (e.g. cards) can skip the surrounding wrapper entirely
 * instead of leaving an empty slot in the layout.
 */
export function isPropertyValueEmpty<T>(
  property: DataViewProperty<T>,
  value: unknown,
  item: T
): boolean {
  switch (property.type) {
    case "checkbox":
      return false;

    case "formula": {
      // Formulas have no static value; invoke with a no-op sub-property
      // renderer to check whether the formula short-circuits to null.
      const result = property.value?.(NOOP_RENDER, item);
      return result == null || result === false || result === "";
    }

    case "button":
      return property.value(item).length === 0;

    case "number":
      return (
        value == null ||
        (typeof value !== "number" && Number.isNaN(Number(value)))
      );

    case "date": {
      if (!value) {
        return true;
      }
      const dateValue = typeof value === "string" ? new Date(value) : value;
      return !(dateValue instanceof Date) || Number.isNaN(dateValue.getTime());
    }

    case "multiSelect":
    case "filesMedia":
      return (
        value == null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      );

    case "rollup": {
      const config = property.config as RollupConfig;
      if (
        config.calculation === "showOriginal" ||
        config.calculation === "showUnique"
      ) {
        return (
          !Array.isArray(value) || value.every((v) => v == null || v === "")
        );
      }
      return (
        value == null ||
        (typeof value !== "number" && Number.isNaN(Number(value)))
      );
    }

    default:
      return value == null || value === "";
  }
}
