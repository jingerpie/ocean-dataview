"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import type { DataViewProperty } from "../../types";
import { cn } from "../utils";
import {
	ChartViewContext,
	type ChartViewContextValue,
} from "./chart-view-context";

export interface ChartViewProviderProps<
	TData,
	TProperties extends readonly DataViewProperty<TData>[],
> {
	data: TData[];
	properties: TProperties;
	children: ReactNode;
	className?: string;
}

export function ChartViewProvider<
	TData,
	TProperties extends
		readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
>({
	data,
	properties,
	children,
	className,
}: ChartViewProviderProps<TData, TProperties>) {
	const contextValue = useMemo<ChartViewContextValue<TData, TProperties>>(
		() => ({ data, properties }),
		[data, properties],
	);

	return (
		<ChartViewContext.Provider
			value={
				contextValue as ChartViewContextValue<
					unknown,
					readonly DataViewProperty<unknown>[]
				>
			}
		>
			<div className={cn("flex flex-col", className)}>{children}</div>
		</ChartViewContext.Provider>
	);
}
