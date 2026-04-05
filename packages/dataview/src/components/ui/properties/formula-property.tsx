"use client";

import type {
  DataViewProperty,
  PropertyRenderFunction,
} from "../../../types/property.type";
import { DataCell } from "../../views/data-cell";

/**
 * Creates a property render function and returns it with the item data.
 *
 * - `property(id)` renders a property with its config and optional name label
 * - `item` provides direct access to raw data values
 *
 * When `showPropertyNames` is true (set by card views), each sub-property
 * rendered via `property(id)` includes a name label above the value.
 * Each sub-property's `showName` overrides the global default.
 *
 * Supports nested formulas with cycle detection.
 * Circular references return null to prevent infinite recursion.
 */
export function createFormulaRenderer<T>(
  data: T,
  properties: readonly DataViewProperty<T>[],
  renderedProperties: Set<string> = new Set(),
  showPropertyNames = false
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

    const cell = (
      <DataCell
        allProperties={properties}
        item={data}
        property={prop}
        renderedProperties={new Set(renderedProperties).add(id)}
        showPropertyNames={showPropertyNames}
        value={value}
      />
    );

    // Resolve name label: property.showName overrides global showPropertyNames
    const resolvedShowName = prop.showName ?? showPropertyNames;
    if (resolvedShowName) {
      return (
        <div className="flex min-w-0 flex-col items-start">
          <span className="text-muted-foreground text-xs">
            {prop.name ?? String(prop.id)}
          </span>
          {cell}
        </div>
      );
    }

    return cell;
  };

  return [render, data];
}
