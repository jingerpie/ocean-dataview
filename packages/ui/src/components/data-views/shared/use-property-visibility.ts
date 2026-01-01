import type { DataViewProperty } from "@ocean-dataview/ui/lib/data-views/types";
import { useDataViewContext } from "./use-data-view-context";

/**
 * Hook to get the effective property visibility
 * Merges view.propertyVisibility (if provided) with context propertyVisibility
 *
 * @param viewPropertyVisibility - Optional property visibility from view config
 * @returns The effective property visibility array
 */
export function usePropertyVisibility<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
>(
	viewPropertyVisibility?: TProperties[number]["id"][],
): TProperties[number]["id"][] {
	const { propertyVisibility: contextPropertyVisibility } =
		useDataViewContext();

	// If view specifies propertyVisibility, use it; otherwise use context
	return (viewPropertyVisibility ??
		contextPropertyVisibility) as TProperties[number]["id"][];
}
