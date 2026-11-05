"use client";

import type {
  DataViewProperty,
  PropertyRenderFunction,
} from "@sparkyidea/dataview-core";
import { resolveShowName } from "@sparkyidea/dataview-core";
import { DataCell } from "@/registry/base-nova/components/dataview/views/data-cell";
import { PropertyNameLabel } from "@/registry/base-nova/components/dataview/views/property-name-label";
import {
  getShowNameValueClasses,
  getShowNameWrapperClasses,
} from "@/registry/base-nova/lib/dataview/show-name-classes";

/**
 * Creates a property render function for formula properties.
 *
 * `property(id)` renders a property with its config and optional name label.
 * Supports nested formulas with cycle detection.
 */
export function createFormulaRenderer<T>(
  data: T,
  properties: readonly DataViewProperty<T>[],
  renderedProperties: Set<string> = new Set(),
  showPropertyNames = false
): PropertyRenderFunction {
  const raw = data as Record<string, unknown>;

  const render: PropertyRenderFunction = (id: string) => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) {
      return null;
    }

    // Cycle detection for formulas
    if (prop.type === "formula" && renderedProperties.has(id)) {
      return null;
    }

    const value = raw[id];

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
    const resolvedShowName = resolveShowName(prop.showName, showPropertyNames);
    if (resolvedShowName) {
      const valueClasses = getShowNameValueClasses(resolvedShowName);
      return (
        <div className={getShowNameWrapperClasses(resolvedShowName)}>
          <PropertyNameLabel
            name={prop.name ?? String(prop.id)}
            resolved={resolvedShowName}
          />
          {valueClasses ? <div className={valueClasses}>{cell}</div> : cell}
        </div>
      );
    }

    return cell;
  };

  return render;
}
