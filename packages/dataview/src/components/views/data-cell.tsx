"use client";

import { memo } from "react";
import type { DataViewProperty, RollupConfig } from "../../types/property.type";
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

// ============================================================================
// Rollup Array Display — renders each item using the underlying type's component
// ============================================================================

function RollupArrayDisplay({
  items,
  rollupConfig,
  wrap,
}: {
  items: unknown[];
  rollupConfig: RollupConfig;
  wrap: boolean;
}) {
  switch (rollupConfig.type) {
    case "select":
    case "multiSelect":
    case "status":
      return (
        <div className="flex flex-wrap gap-1">
          {items.map((v, i) => (
            <SelectProperty
              config={{ options: rollupConfig.options ?? [] }}
              key={`${String(v)}-${i}`}
              value={v as string | null}
            />
          ))}
        </div>
      );

    case "date":
      return (
        <span className="text-sm">
          {items.map((v, i) => (
            <span key={`${String(v)}-${i}`}>
              {i > 0 && ", "}
              <DateProperty
                config={{
                  dateFormat: rollupConfig.dateFormat,
                  timeFormat: rollupConfig.timeFormat,
                }}
                value={v as Date | string | null}
              />
            </span>
          ))}
        </span>
      );

    case "checkbox":
      return (
        <div className="flex flex-wrap gap-1">
          {items.map((v, i) => (
            <CheckboxProperty
              key={`${String(v)}-${i}`}
              value={v as boolean | null}
            />
          ))}
        </div>
      );

    case "filesMedia":
      return <FilesMediaProperty value={items as string[]} />;

    case "number":
      return (
        <span className="text-sm">
          {items.map((v, i) => (
            <span key={`${String(v)}-${i}`}>
              {i > 0 && ", "}
              <NumberProperty
                config={{
                  numberFormat: rollupConfig.numberFormat,
                  decimalPlaces: rollupConfig.decimalPlaces,
                  scale: rollupConfig.scale,
                  showAs: rollupConfig.showAs,
                }}
                value={v as number | null}
              />
            </span>
          ))}
        </span>
      );

    case "url":
      return (
        <span className="text-sm">
          {items.map((v, i) => (
            <span key={`${String(v)}-${i}`}>
              {i > 0 && ", "}
              <UrlProperty value={v as string | null} />
            </span>
          ))}
        </span>
      );

    // text, email, phone — render as comma-separated text
    default:
      return <TextProperty value={items.join(", ")} wrap={wrap} />;
  }
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
      const propertyRender = createFormulaRenderer(
        item,
        allProperties,
        renderedProperties,
        showPropertyNames
      );
      return <>{valueFn(propertyRender, item)}</>;
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

    case "rollup": {
      const rollupConfig = property.config as RollupConfig;
      if (
        rollupConfig.calculation === "showOriginal" ||
        rollupConfig.calculation === "showUnique"
      ) {
        const items = Array.isArray(displayValue) ? displayValue : [];
        if (items.length === 0) {
          return <TextProperty value={null} wrap={false} />;
        }
        return (
          <RollupArrayDisplay
            items={items}
            rollupConfig={rollupConfig}
            wrap={wrap ?? property.wrap ?? false}
          />
        );
      }
      return (
        <NumberProperty
          config={{
            numberFormat: rollupConfig.numberFormat,
            decimalPlaces: rollupConfig.decimalPlaces,
            scale: rollupConfig.scale,
            showAs: rollupConfig.showAs,
          }}
          value={displayValue as number | null}
        />
      );
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
