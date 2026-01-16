"use client";

import { Badge } from "@ocean-dataview/dataview/components/ui/badge";
import { getBadgeVariant } from "../../../lib/utils/get-badge-variant";
import type { MultiSelectPropertyType } from "../../../types/property-types";

interface MultiSelectPropertyProps<T> {
	value: unknown;
	property: MultiSelectPropertyType<T>;
}

export function MultiSelectProperty<T>({
	value,
	property,
}: MultiSelectPropertyProps<T>) {
	if (!value || (Array.isArray(value) && value.length === 0)) {
		return <span className="text-muted-foreground text-sm">-</span>;
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
					(opt) => opt.value === stringValue
				);

				// If option not found, still render as badge with gray color
				if (!option) {
					return (
						<Badge key={stringValue} variant="gray-subtle">
							{stringValue}
						</Badge>
					);
				}

				const variant = getBadgeVariant(option.color);

				return (
					<Badge key={option.value} variant={variant}>
						{option.label}
					</Badge>
				);
			})}
			{remainingCount > 0 && <Badge variant="outline">+{remainingCount}</Badge>}
		</div>
	);
}
