"use client";

import type {
  DataViewProperty,
  PropertyRenderFunction,
} from "../../../types/property.type";
import { DataCell } from "../../views/data-cell";

/**
 * Creates a property render function and returns it with the item data.
 *
 * - `property(id)` renders a property with its config
 * - `item` provides direct access to raw data values
 *
 * Supports nested formulas with cycle detection.
 * Circular references return null to prevent infinite recursion.
 */
export function createFormulaRenderer<T>(
  data: T,
  properties: readonly DataViewProperty<T>[],
  renderedProperties: Set<string> = new Set()
): [PropertyRenderFunction, T] {
  const render: PropertyRenderFunction = (id: string) => {
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

  return [render, data];
}
