"use client";

import { Badge } from "@ocean-dataview/dataview/components/ui/badge";
import type { StatusPropertyType } from "../../../lib/data-views/types/property-types";
import {
	STATUS_LABEL_TO_GROUP,
	type StatusGroup,
} from "../../../lib/data-views/utils/status-constants";

interface StatusPropertyProps<T> {
	value: unknown;
	property: StatusPropertyType<T>;
}

// Group badge configuration extracted for performance
const GROUP_BADGE_CONFIG: Record<
	StatusGroup,
	{
		variant: "gray-subtle" | "blue-subtle" | "green-subtle" | "red-subtle";
		dotColor: string;
	}
> = {
	todo: {
		variant: "gray-subtle",
		dotColor: "bg-badge-gray-subtle-foreground",
	},
	inProgress: {
		variant: "blue-subtle",
		dotColor: "bg-badge-blue-subtle-foreground",
	},
	complete: {
		variant: "green-subtle",
		dotColor: "bg-badge-green-subtle-foreground",
	},
	canceled: {
		variant: "red-subtle",
		dotColor: "bg-badge-red-subtle-foreground",
	},
};

export function StatusProperty<T>({ value, property }: StatusPropertyProps<T>) {
	if (!value) {
		return <span className="text-muted-foreground text-sm">-</span>;
	}

	const stringValue = String(value);

	// Check if this is a status group label (when using showAs: "group")
	if (STATUS_LABEL_TO_GROUP[stringValue]) {
		const group = STATUS_LABEL_TO_GROUP[stringValue];
		const { variant, dotColor } = GROUP_BADGE_CONFIG[group];
		return (
			<Badge
				variant={variant}
				render={<div className={`h-2 w-2 rounded-full ${dotColor}`} />}
			>
				{stringValue}
			</Badge>
		);
	}

	// Try to find option by value
	const option = property.config?.options?.find(
		(opt) => opt.value === stringValue,
	);

	// If option not found, still render as badge with gray color (default todo group)
	if (!option) {
		const { variant, dotColor } = GROUP_BADGE_CONFIG.todo;
		return (
			<Badge
				variant={variant}
				render={<div className={`h-2 w-2 rounded-full ${dotColor}`} />}
			>
				{stringValue}
			</Badge>
		);
	}

	// Default to 'todo' if no group is defined
	const { variant, dotColor } = GROUP_BADGE_CONFIG[option.group || "todo"];

	return (
		<Badge
			variant={variant}
			render={<div className={`h-2 w-2 rounded-full ${dotColor}`} />}
		>
			{option.label}
		</Badge>
	);
}
