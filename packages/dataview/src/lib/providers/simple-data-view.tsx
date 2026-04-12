"use client";

import { type ReactNode, useCallback, useMemo } from "react";
import { usePageController } from "../../hooks/use-page-controller";
import type { DataViewProperty } from "../../types/property.type";
import { DataViewProvider, type DefaultsConfig } from "./data-view-provider";

/**
 * Props for SimpleDataViewProvider.
 * Renders static in-memory data through the dataview system without
 * requiring manual controller setup.
 */
export interface SimpleDataViewProviderProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  children: ReactNode;
  className?: string;
  /** Static data array to display */
  data: TData[];
  /** URL defaults (e.g. limit, sort) */
  defaults?: Omit<DefaultsConfig, "limit">;
  properties: TProperties;
  propertyVisibility?: TProperties[number]["id"][];
}

/**
 * SimpleDataViewProvider - Renders static data through the dataview system.
 *
 * Use this when you already have data in memory and want to display it
 * in a TableView, ListView, or GalleryView without setting up a controller.
 *
 * @example
 * ```tsx
 * <SimpleDataViewProvider data={order.orderLines} properties={orderItemsProperties}>
 *   <TableView showVerticalLines={false} />
 * </SimpleDataViewProvider>
 * ```
 */
export function SimpleDataViewProvider<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
>({
  children,
  className,
  data,
  defaults,
  properties,
  propertyVisibility,
}: SimpleDataViewProviderProps<TData, TProperties>) {
  // Stable query key that changes when data reference changes
  const queryKey = useMemo(() => ["static-data", data] as const, [data]);

  const staticResponse = useMemo(
    () => ({
      items: data,
      hasNextPage: false,
      hasPreviousPage: false,
      endCursor: null,
      startCursor: null,
    }),
    [data]
  );

  const dataQuery = useCallback(
    () => ({
      queryKey,
      queryFn: () => Promise.resolve(staticResponse),
      initialData: staticResponse,
    }),
    [queryKey, staticResponse]
  );

  const { controller } = usePageController({ dataQuery });

  // Set limit to data length so all items show on one page
  const mergedDefaults: DefaultsConfig = {
    ...defaults,
    limit: 100,
  };

  return (
    <DataViewProvider
      className={className}
      controller={controller}
      defaults={mergedDefaults}
      properties={properties}
      propertyVisibility={propertyVisibility}
    >
      {children}
    </DataViewProvider>
  );
}
