"use client";

import { memo } from "react";
import type { DataViewProperty } from "../../types/property.type";
import { CheckboxProperty } from "../ui/properties/checkbox-property";
import { DateProperty } from "../ui/properties/date-property";
import { EmailProperty } from "../ui/properties/email-property";
import { FilesMediaProperty } from "../ui/properties/files-media-property";
import { createFormulaRenderer } from "../ui/properties/formula-property";
import { MultiSelectProperty } from "../ui/properties/multi-select-property";
import { NumberProperty } from "../ui/properties/number-property";
import { PhoneProperty } from "../ui/properties/phone-property";
import { SelectProperty } from "../ui/properties/select-property";
import { StatusProperty } from "../ui/properties/status-property";
import { TextProperty } from "../ui/properties/text-property";
import { UrlProperty } from "../ui/properties/url-property";

interface DataCellProps<T> {
  /**
   * All property definitions - required for formula properties
   * to render other properties via `property(id)` renderer
   */
  allProperties?: readonly DataViewProperty<T>[];
  item: T;
  property: DataViewProperty<T>;
  /**
   * Internal: tracks renderedProperties formula IDs to detect circular references
   */
  renderedProperties?: Set<string>;
  value: unknown;
  wrap?: boolean;
}

/**
 * Master property display component that delegates to type-specific property components
 * Memoized to prevent unnecessary re-renders in table cells
 */
function DataCellComponent<T>({
  value,
  property,
  item,
  wrap = false,
  allProperties,
  renderedProperties = new Set(),
}: DataCellProps<T>) {
  const displayValue = value;

  switch (property.type) {
    case "formula": {
      const valueFn = property.value;
      if (!(valueFn && allProperties)) {
        return null;
      }
      const renderer = createFormulaRenderer(
        item,
        allProperties,
        renderedProperties
      );
      return <>{valueFn(renderer)}</>;
    }

    case "text":
      return <TextProperty value={displayValue as string | null} wrap={wrap} />;

    case "number":
      return (
        <NumberProperty
          config={property.config}
          value={displayValue as number | null}
        />
      );

    case "select":
      return (
        <SelectProperty
          config={property.config}
          value={displayValue as string | null}
        />
      );

    case "multiSelect":
      return (
        <MultiSelectProperty
          config={property.config}
          value={displayValue as string[]}
        />
      );

    case "status":
      return (
        <StatusProperty
          config={property.config}
          value={displayValue as string | null}
        />
      );

    case "date":
      return (
        <DateProperty
          config={property.config}
          value={displayValue as Date | null}
        />
      );

    case "checkbox":
      return <CheckboxProperty value={displayValue as boolean | null} />;

    case "url":
      return (
        <UrlProperty
          config={property.config}
          value={displayValue as string | null}
        />
      );

    case "email":
      return <EmailProperty value={displayValue as string | null} />;

    case "phone":
      return <PhoneProperty value={displayValue as string | null} />;

    case "filesMedia":
      return <FilesMediaProperty value={displayValue as string[]} />;

    default:
      return (
        <span className="text-sm">
          {displayValue != null ? String(displayValue) : "-"}
        </span>
      );
  }
}

/**
 * Memoized DataCell component
 * Prevents unnecessary re-renders in table cells and list items
 */
export const DataCell = memo(DataCellComponent) as typeof DataCellComponent;

// Re-export with old name for backwards compatibility
export { DataCell as PropertyDisplay };
