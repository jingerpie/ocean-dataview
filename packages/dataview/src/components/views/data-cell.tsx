"use client";

import { memo } from "react";
import type { DataViewProperty } from "../../types/property.type";
import { ButtonProperty } from "../ui/properties/button-property";
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
   * All property schema - required for formula properties
   * to render other properties via `property(id)` renderer
   */
  allProperties?: readonly DataViewProperty<T>[];
  /**
   * Override property config for specific rendering contexts (e.g., group headers)
   * Merged with property.config, with configOverride taking precedence
   */
  configOverride?: Record<string, unknown>;
  item: T;
  property: DataViewProperty<T>;
  /**
   * Internal: tracks renderedProperties formula IDs to detect circular references
   */
  renderedProperties?: Set<string>;
  /**
   * Global default for showing property names in formula sub-properties.
   * Each sub-property's `showName` overrides this.
   * Only used by formula properties to pass through to createFormulaRenderer.
   */
  showPropertyNames?: boolean;
  value: unknown;
  wrap?: boolean;
}

/**
 * Property value renderer — delegates to type-specific property components.
 * Name labels are NOT rendered here; they are handled by the consumer
 * (DataCard for top-level properties, createFormulaRenderer for sub-properties).
 * Memoized to prevent unnecessary re-renders in table cells.
 */
function DataCellComponent<T>({
  value,
  property,
  item,
  wrap,
  allProperties,
  configOverride,
  renderedProperties = new Set(),
  showPropertyNames = false,
}: DataCellProps<T>) {
  const displayValue = value;

  // Helper to merge property config with override
  const getConfig = <C,>(baseConfig: C | undefined): C | undefined => {
    if (!configOverride) {
      return baseConfig;
    }
    return { ...baseConfig, ...configOverride } as C;
  };

  switch (property.type) {
    case "formula": {
      const valueFn = property.value;
      if (!(valueFn && allProperties)) {
        return null;
      }
      const [propertyRender, itemData] = createFormulaRenderer(
        item,
        allProperties,
        renderedProperties,
        showPropertyNames
      );
      return <>{valueFn(propertyRender, itemData)}</>;
    }

    case "text":
      return (
        <TextProperty
          value={displayValue as string | null}
          wrap={wrap ?? property.wrap ?? false}
        />
      );

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
          config={getConfig(property.config)}
          value={displayValue as Date | string | null}
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

    case "button": {
      const buttons = property.value(item);
      return <ButtonProperty buttons={buttons} />;
    }

    default:
      return (
        <span className="text-sm">
          {displayValue == null ? "-" : String(displayValue)}
        </span>
      );
  }
}

/**
 * Memoized DataCell component
 * Prevents unnecessary re-renders in table cells and list items
 */
export const DataCell = memo(DataCellComponent) as typeof DataCellComponent;
