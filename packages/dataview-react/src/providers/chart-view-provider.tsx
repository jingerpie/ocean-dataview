"use client";

import type { DataViewProperty } from "@sparkyidea/dataview-core";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  ChartViewContext,
  type ChartViewContextValue,
} from "./chart-view-context";

export interface ChartViewProviderProps<
  TData,
  TProperties extends readonly DataViewProperty<NoInfer<TData>>[],
> {
  children: ReactNode;
  data: TData[];
  properties: TProperties;
}

export function ChartViewProvider<
  TData,
  const TProperties extends readonly DataViewProperty<NoInfer<TData>>[],
>({ data, properties, children }: ChartViewProviderProps<TData, TProperties>) {
  const contextValue = useMemo<ChartViewContextValue<TData, TProperties>>(
    () => ({ data, properties }),
    [data, properties]
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
      {children}
    </ChartViewContext.Provider>
  );
}
