"use client";

import type {
  DataViewProperty,
  PropertyFunction,
} from "../../../types/property.type";
import { DataCell } from "../../views/data-cell";

/**
 * Creates a renderer function for formula properties.
 * - `property(id)` renders a property with its config
 * - `property.raw(id)` returns the raw data value
 *
 * Supports nested formulas with cycle detection.
 * Circular references return null to prevent infinite recursion.
 */
export function createFormulaRenderer<T>(
  data: T,
  properties: readonly DataViewProperty<T>[],
  renderedProperties: Set<string> = new Set()
): PropertyFunction<T> {
  const render = (id: string) => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) {
      return null;
    }

    // Cycle detection for formulas
    if (prop.type === "formula" && renderedProperties.has(id)) {
      return null; // Circular reference detected
    }

    const value = (data as Record<string, unknown>)[id];

    return (
      <DataCell
        allProperties={properties}
        item={data}
        property={prop}
        renderedProperties={new Set(renderedProperties).add(id)}
        value={value}
      />
    );
  };

  render.raw = <K extends keyof T>(id: K): T[K] => data[id];

  return render;
}
