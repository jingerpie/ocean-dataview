"use client";

import { memo } from "react";
import { createPropertyRenderer } from "../../../lib/utils/create-property-renderer";
import type { DataViewProperty } from "../../../types/property-types";
import { CheckboxProperty } from "./checkbox-property";
import { DateProperty } from "./date-property";
import { EmailProperty } from "./email-property";
import { FilesMediaProperty } from "./files-media-property";
import { MultiSelectProperty } from "./multi-select-property";
import { NumberProperty } from "./number-property";
import { PhoneProperty } from "./phone-property";
import { SelectProperty } from "./select-property";
import { StatusProperty } from "./status-property";
import { TextProperty } from "./text-property";
import { UrlProperty } from "./url-property";

interface PropertyDisplayProps<T> {
  value: unknown;
  property: DataViewProperty<T>;
  item: T;
  wrap?: boolean;
  /**
   * All property definitions - required for formula properties
   * to render other properties via `property(id)` renderer
   */
  allProperties?: readonly DataViewProperty<T>[];
}

/**
 * Master property display component that delegates to type-specific property components
 * Memoized to prevent unnecessary re-renders in table cells
 */
function PropertyDisplayComponent<T>({
  value,
  property,
  item,
  wrap = false,
  allProperties,
}: PropertyDisplayProps<T>) {
  // Use the transformed value directly - transformation already happened in transformData()
  // For properties with value functions, the result is already computed
  // For properties without value functions, the field was auto-mapped
  const displayValue = value;

  switch (property.type) {
    case "formula": {
      const valueFn = property.value;
      if (!(valueFn && allProperties)) {
        return null;
      }
      // Formula API: value(propertyRenderer, data) => ReactNode
      const renderer = createPropertyRenderer(item, allProperties);
      return <>{valueFn(renderer, item)}</>;
    }

    case "text":
      return (
        <TextProperty property={property} value={displayValue} wrap={wrap} />
      );

    case "number":
      return <NumberProperty property={property} value={displayValue} />;

    case "select":
      return <SelectProperty property={property} value={displayValue} />;

    case "multiSelect":
      return <MultiSelectProperty property={property} value={displayValue} />;

    case "status":
      return <StatusProperty property={property} value={displayValue} />;

    case "date":
      return <DateProperty property={property} value={displayValue} />;

    case "checkbox":
      return <CheckboxProperty property={property} value={displayValue} />;

    case "url":
      return <UrlProperty property={property} value={displayValue} />;

    case "email":
      return <EmailProperty property={property} value={displayValue} />;

    case "phone":
      return <PhoneProperty property={property} value={displayValue} />;

    case "filesMedia":
      return (
        <FilesMediaProperty
          property={property}
          value={displayValue}
          wrap={wrap}
        />
      );

    default:
      // Fallback for unknown types
      return (
        <span className="text-sm">
          {displayValue != null ? String(displayValue) : "-"}
        </span>
      );
  }
}

/**
 * Memoized PropertyDisplay component
 * Prevents unnecessary re-renders in table cells and list items
 */
export const PropertyDisplay = memo(
  PropertyDisplayComponent
) as typeof PropertyDisplayComponent;
