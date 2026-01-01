"use client";

import { Badge } from "@ocean-dataview/ui/components/badge";
import { EmptyValue } from "../components/empty-value";
import type { MultiSelectPropertyType } from "../types/property-types";
import { getBadgeVariant } from "../utils/badge-variant-mapper";

interface MultiSelectPropertyProps<T> {
	value: unknown;
	property: MultiSelectPropertyType<T>;
}

export function MultiSelectProperty<T>({
	value,
	property,
}: MultiSelectPropertyProps<T>) {
	if (!value || (Array.isArray(value) && value.length === 0)) {
		return <EmptyValue />;
	}

	const values = Array.isArray(value) ? value : [value];
	const displayLimit = property.config?.displayLimit ?? 2;

	const visibleValues = values.slice(0, displayLimit);
	const remainingCount = values.length - displayLimit;

	return (
		<div className="flex flex-wrap gap-1">
			{visibleValues.map((val) => {
				const stringValue = String(val);
				const option = property.config?.options?.find(
					(opt) => opt.value === stringValue,
				);

				// If option not found, still render as badge with gray color
				if (!option) {
					return (
						<Badge key={stringValue} variant="gray-subtle" size="sm">
							{stringValue}
						</Badge>
					);
				}

				const variant = getBadgeVariant(option.color);

				return (
					<Badge key={option.value} variant={variant} size="sm">
						{option.label}
					</Badge>
				);
			})}
			{remainingCount > 0 && (
				<Badge variant="outline" size="sm">
					+{remainingCount}
				</Badge>
			)}
		</div>
	);
}
