export type ChartColorScheme =
	| "colorful"
	| "colorless"
	| "blue"
	| "yellow"
	| "green"
	| "purple"
	| "teal"
	| "orange"
	| "pink"
	| "red";

/**
 * Chart color map constant - extracted to module level for performance
 * Prevents recreating this object on every function call
 */
const CHART_COLOR_MAP: Record<ChartColorScheme, string[]> = {
	colorful: [
		"var(--chart-colorful-1)",
		"var(--chart-colorful-2)",
		"var(--chart-colorful-3)",
		"var(--chart-colorful-4)",
		"var(--chart-colorful-5)",
	],
	colorless: [
		"var(--chart-colorless-1)",
		"var(--chart-colorless-2)",
		"var(--chart-colorless-3)",
		"var(--chart-colorless-4)",
		"var(--chart-colorless-5)",
	],
	blue: [
		"var(--chart-blue-1)",
		"var(--chart-blue-2)",
		"var(--chart-blue-3)",
		"var(--chart-blue-4)",
		"var(--chart-blue-5)",
	],
	yellow: [
		"var(--chart-yellow-1)",
		"var(--chart-yellow-2)",
		"var(--chart-yellow-3)",
		"var(--chart-yellow-4)",
		"var(--chart-yellow-5)",
	],
	green: [
		"var(--chart-green-1)",
		"var(--chart-green-2)",
		"var(--chart-green-3)",
		"var(--chart-green-4)",
		"var(--chart-green-5)",
	],
	purple: [
		"var(--chart-purple-1)",
		"var(--chart-purple-2)",
		"var(--chart-purple-3)",
		"var(--chart-purple-4)",
		"var(--chart-purple-5)",
	],
	teal: [
		"var(--chart-teal-1)",
		"var(--chart-teal-2)",
		"var(--chart-teal-3)",
		"var(--chart-teal-4)",
		"var(--chart-teal-5)",
	],
	orange: [
		"var(--chart-orange-1)",
		"var(--chart-orange-2)",
		"var(--chart-orange-3)",
		"var(--chart-orange-4)",
		"var(--chart-orange-5)",
	],
	pink: [
		"var(--chart-pink-1)",
		"var(--chart-pink-2)",
		"var(--chart-pink-3)",
		"var(--chart-pink-4)",
		"var(--chart-pink-5)",
	],
	red: [
		"var(--chart-red-1)",
		"var(--chart-red-2)",
		"var(--chart-red-3)",
		"var(--chart-red-4)",
		"var(--chart-red-5)",
	],
};

/**
 * Get chart colors based on color scheme
 * Returns CSS variable references that work in both light and dark mode
 */
export function getChartColors(
	colorScheme: ChartColorScheme,
	count: number,
): string[] {
	const colors = CHART_COLOR_MAP[colorScheme] || CHART_COLOR_MAP.colorful;
	if (colors.length === 0) {
		return [];
	}

	// Cycle through colors if count > available colors
	return Array.from({ length: count }, (_, i) => {
		const color = colors[i % colors.length];
		return color ?? colors[0] ?? "#000000";
	});
}

/**
 * Get chart height in pixels based on size
 */
export function getChartHeight(
	size: "small" | "medium" | "large" | "extraLarge",
): number {
	const heightMap = {
		small: 200,
		medium: 300,
		large: 400,
		extraLarge: 500,
	};
	return heightMap[size];
}
