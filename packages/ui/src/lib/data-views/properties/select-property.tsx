"use client";

import { Badge } from "@ocean-dataview/ui/components/badge";
import { EmptyValue } from "../components/empty-value";
import type { SelectPropertyType } from "../types/property-types";
import { getBadgeVariant } from "../utils/badge-variant-mapper";

interface SelectPropertyProps<T> {
	value: unknown;
	property: SelectPropertyType<T>;
}

/**
 * Displays single-select values as styled badges
 * Automatically generates badge colors from config options
 * @param value - The selected value
 * @param property - Property configuration with select options
 * @returns Colored badge with option label
 */
export function SelectProperty<T>({ value, property }: SelectPropertyProps<T>) {
	if (!value) {
		return <EmptyValue />;
	}

	const stringValue = String(value);
	const option = property.config?.options?.find(
		(opt) => opt.value === stringValue,
	);

	// If option not found, still render as badge with gray color
	if (!option) {
		return <Badge variant="gray-subtle">{stringValue}</Badge>;
	}

	const variant = getBadgeVariant(option.color);

	return <Badge variant={variant}>{option.label}</Badge>;
}
