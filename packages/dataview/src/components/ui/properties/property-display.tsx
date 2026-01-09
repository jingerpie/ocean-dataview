"use client";

import { memo } from "react";
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
}

/**
 * Master property display component that delegates to type-specific property components
 * Memoized to prevent unnecessary re-renders in table cells
 */
function PropertyDisplayComponent<T>({
	value,
	property,
	wrap = false,
}: PropertyDisplayProps<T>) {
	// Use the transformed value directly - transformation already happened in transformData()
	// For properties with value functions, the result is already computed
	// For properties without value functions, the field was auto-mapped
	const displayValue = value;

	switch (property.type) {
		case "custom":
			// For custom type, displayValue is already JSX from the value function
			return <>{displayValue}</>;

		case "text":
			return (
				<TextProperty value={displayValue} property={property} wrap={wrap} />
			);

		case "number":
			return <NumberProperty value={displayValue} property={property} />;

		case "select":
			return <SelectProperty value={displayValue} property={property} />;

		case "multi-select":
			return <MultiSelectProperty value={displayValue} property={property} />;

		case "status":
			return <StatusProperty value={displayValue} property={property} />;

		case "date":
			return <DateProperty value={displayValue} property={property} />;

		case "checkbox":
			return <CheckboxProperty value={displayValue} property={property} />;

		case "url":
			return <UrlProperty value={displayValue} property={property} />;

		case "email":
			return <EmailProperty value={displayValue} property={property} />;

		case "phone":
			return <PhoneProperty value={displayValue} property={property} />;

		case "files-media":
			return (
				<FilesMediaProperty
					value={displayValue}
					property={property}
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
	PropertyDisplayComponent,
) as typeof PropertyDisplayComponent;
