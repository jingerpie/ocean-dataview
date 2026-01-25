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
	PropertyRenderer,
} from "../../types/property-types";

/**
 * Creates a PropertyRenderer function for use in formula properties.
 *
 * The returned function takes a property ID and renders that property's value
 * using its full configuration (colors, formats, etc.).
 *
 * @param data - The raw data item containing property values
 * @param properties - All property definitions for looking up configs
 * @returns A PropertyRenderer function that renders properties by ID
 *
 * @example
 * ```tsx
 * // Inside formula property:
 * value: (property, data) => (
 *   <div>
 *     {property("name")}        // Renders name as text
 *     {property("familyGroup")} // Renders with select colors
 *   </div>
 * )
 * ```
 */
export function createPropertyRenderer<TData>(
	data: TData,
	properties: readonly DataViewProperty<TData>[]
): PropertyRenderer {
	return (id: string) => {
		// Find the property definition
		const property = properties.find((p) => p.id === id);
		if (!property) {
			return null;
		}

		// Get the value for this property
		let value: unknown;
		if (property.type === "formula") {
			// Formulas can't be nested - return null
			return null;
		}
		if (property.value) {
			value = property.value(data);
		} else {
			value = (data as Record<string, unknown>)[id];
		}

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
}
