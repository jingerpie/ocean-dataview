import type { PropertyType } from "@ocean-dataview/dataview/types";
import {
	ALargeSmallIcon,
	AtSignIcon,
	CalendarIcon,
	CheckSquareIcon,
	CircleCheckIcon,
	CircleDotIcon,
	FileIcon,
	FunctionSquareIcon,
	HashIcon,
	LinkIcon,
	ListIcon,
	type LucideIcon,
	PhoneIcon,
} from "lucide-react";

/**
 * Mapping of property types to their corresponding Lucide icons.
 */
export const PROPERTY_TYPE_ICONS: Record<PropertyType, LucideIcon> = {
	text: ALargeSmallIcon,
	number: HashIcon,
	select: CircleDotIcon,
	multiSelect: ListIcon,
	status: CircleCheckIcon,
	date: CalendarIcon,
	filesMedia: FileIcon,
	checkbox: CheckSquareIcon,
	url: LinkIcon,
	email: AtSignIcon,
	phone: PhoneIcon,
	formula: FunctionSquareIcon,
};

/**
 * Get the icon component for a given property type.
 *
 * @param type - The property type
 * @returns The corresponding Lucide icon component
 */
export function getPropertyIcon(type: PropertyType): LucideIcon {
	return PROPERTY_TYPE_ICONS[type] ?? ALargeSmallIcon;
}
