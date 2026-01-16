"use client";

import { createContext, useContext } from "react";
import type { DataViewProperty } from "../../types";

export interface ChartViewContextValue<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	data: TData[];
	properties: TProperties;
}

export const ChartViewContext = createContext<ChartViewContextValue<
	unknown,
	readonly DataViewProperty<unknown>[]
> | null>(null);

export function useChartViewContext<
	TData,
	TProperties extends
		readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
>(): ChartViewContextValue<TData, TProperties> {
	const context = useContext(ChartViewContext);
	if (!context) {
		throw new Error(
			"useChartViewContext must be used within ChartViewProvider"
		);
	}
	return context as ChartViewContextValue<TData, TProperties>;
}
