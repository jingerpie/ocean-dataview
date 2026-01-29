"use client";

import { CheckboxProperty } from "../../components/ui/properties/checkbox-property";
import { DateProperty } from "../../components/ui/properties/date-property";
import { EmailProperty } from "../../components/ui/properties/email-property";
import { FilesMediaProperty } from "../../components/ui/properties/files-media-property";
import { MultiSelectProperty } from "../../components/ui/properties/multi-select-property";
import { NumberProperty } from "../../components/ui/properties/number-property";
import { PhoneProperty } from "../../components/ui/properties/phone-property";
import { SelectProperty } from "../../components/ui/properties/select-property";
import { StatusProperty } from "../../components/ui/properties/status-property";
import { TextProperty } from "../../components/ui/properties/text-property";
import { UrlProperty } from "../../components/ui/properties/url-property";
import type {
  DataViewProperty,
  PropertyFunction,
} from "../../types/property-types";

/**
 * Creates a PropertyFunction for use in formula properties.
 *
 * The returned function has two modes:
 * - `property(id)` - Renders the property with its full config (colors, formats, etc.)
 * - `property.raw(id)` - Returns the typed raw data value for that property
 *
 * @param data - The raw data item containing property values
 * @param properties - All property definitions for looking up configs
 * @returns A PropertyFunction that renders properties and provides type-safe raw data access
 *
 * @example
 * ```tsx
 * // Inside formula property:
 * value: (property) => (
 *   <div>
 *     {property("name")}        // Renders name as text
 *     {property("familyGroup")} // Renders with select colors
 *     {property.raw("minCalories") > 500 && <span>High cal</span>}
 *   </div>
 * )
 * ```
 */
export function createPropertyRenderer<TData>(
  data: TData,
  properties: readonly DataViewProperty<TData>[]
): PropertyFunction<TData> {
  // Internal helper to get raw value (uses string for internal rendering)
  const getValueInternal = (id: string): unknown => {
    return (data as Record<string, unknown>)[id];
  };

  // Type-safe raw value accessor for public API
  const getRawValue = <K extends keyof TData>(id: K): TData[K] => {
    return data[id];
  };

  // Render function
  const render = (id: string) => {
    // Find the property definition
    const property = properties.find((p) => p.id === id);
    if (!property) {
      return null;
    }

    // Formulas can't be nested - return null
    if (property.type === "formula") {
      return null;
    }

    // Get raw value from data (internal, untyped)
    const value = getValueInternal(id);

    // Render based on property type
    switch (property.type) {
      case "text":
        return <TextProperty property={property} value={value} wrap={false} />;

      case "number":
        return <NumberProperty property={property} value={value} />;

      case "select":
        return <SelectProperty property={property} value={value} />;

      case "multiSelect":
        return <MultiSelectProperty property={property} value={value} />;

      case "status":
        return <StatusProperty property={property} value={value} />;

      case "date":
        return <DateProperty property={property} value={value} />;

      case "checkbox":
        return <CheckboxProperty property={property} value={value} />;

      case "url":
        return <UrlProperty property={property} value={value} />;

      case "email":
        return <EmailProperty property={property} value={value} />;

      case "phone":
        return <PhoneProperty property={property} value={value} />;

      case "filesMedia":
        return (
          <FilesMediaProperty property={property} value={value} wrap={false} />
        );

      default:
        // Fallback for unknown types
        return (
          <span className="text-sm">{value != null ? String(value) : "-"}</span>
        );
    }
  };

  // Attach raw method to the render function
  render.raw = getRawValue;

  return render;
}
