"use client";

import type { PropertyComponentProps } from "../../../types/formula-property.type";
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

/**
 * Property component namespace for manual composition in formula properties.
 * Use these when you need direct control over rendering with custom configs.
 *
 * For automatic config application, use the `property(id)` renderer instead.
 *
 * @example
 * import { Property } from "@ocean-dataview/dataview/data-views";
 *
 * {
 *   id: "summary",
 *   type: "formula",
 *   value: (property) => (
 *     <div className="flex gap-2">
 *       <Property.Text value={property.raw("title")} />
 *       <Property.Number value={property.raw("price")} config={{ numberFormat: "dollar" }} />
 *     </div>
 *   )
 * }
 */
export const Property = {
  Text: ({ value, wrap = false }: PropertyComponentProps<"text">) => (
    <TextProperty value={value} wrap={wrap} />
  ),

  Number: ({ value, config }: PropertyComponentProps<"number">) => (
    <NumberProperty config={config} value={value} />
  ),

  Select: ({ value, config }: PropertyComponentProps<"select">) => (
    <SelectProperty config={config} value={value} />
  ),

  MultiSelect: ({ value, config }: PropertyComponentProps<"multiSelect">) => (
    <MultiSelectProperty config={config} value={value} />
  ),

  Status: ({ value, config }: PropertyComponentProps<"status">) => (
    <StatusProperty config={config} value={value} />
  ),

  Date: ({ value, config }: PropertyComponentProps<"date">) => (
    <DateProperty config={config} value={value} />
  ),

  Checkbox: ({ value }: PropertyComponentProps<"checkbox">) => (
    <CheckboxProperty value={value} />
  ),

  Url: ({ value, config }: PropertyComponentProps<"url">) => (
    <UrlProperty config={config} value={value} />
  ),

  Email: ({ value, config }: PropertyComponentProps<"email">) => (
    <EmailProperty config={config} value={value} />
  ),

  Phone: ({ value, config }: PropertyComponentProps<"phone">) => (
    <PhoneProperty config={config} value={value} />
  ),

  FilesMedia: ({
    value,
    wrap = false,
  }: PropertyComponentProps<"filesMedia">) => (
    <FilesMediaProperty value={value} wrap={wrap} />
  ),
};
