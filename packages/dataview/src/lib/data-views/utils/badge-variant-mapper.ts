/**
 * Badge variant utilities for property components
 */

export type BadgeVariant =
	| "secondary"
	| "gray-subtle"
	| "blue-subtle"
	| "purple-subtle"
	| "yellow-subtle"
	| "red-subtle"
	| "pink-subtle"
	| "green-subtle"
	| "teal-subtle";

/**
 * Maps property color to badge variant (using subtle variants)
 * @param color - The color name from property config
 * @returns Badge variant name, defaults to "gray-subtle" if not found
 */
export function getBadgeVariant(color?: string): BadgeVariant {
	const colorMap: Record<string, BadgeVariant> = {
		gray: "gray-subtle",
		blue: "blue-subtle",
		purple: "purple-subtle",
		yellow: "yellow-subtle",
		red: "red-subtle",
		pink: "pink-subtle",
		green: "green-subtle",
		teal: "teal-subtle",
	};
	return colorMap[color || "gray"] || "gray-subtle";
}
