"use client";

import type { DataViewProperty, GroupCounts } from "@sparkyidea/dataview-core";
import {
  buildGroupItems,
  getGroupOptions,
  validatePropertyKeys,
} from "@sparkyidea/dataview-core";
import { useMemo } from "react";
import { useDataViewContext } from "../providers/data-view-context";
import { useDataViewSetup } from "../providers/data-view-provider";
import { useGroupParams } from "./use-group-params";

/**
 * Board state derived from the DataView context: board columns, accordion
 * row groups, and the properties behind them. Renders nothing.
 *
 * Board terminology: column = board columns, group = accordion rows.
 * Throws when the provider uses a page controller.
 */
export function useBoardModel<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
>(options?: { columnCounts?: GroupCounts }) {
  const context = useDataViewContext<TData, TProperties>();
  const {
    properties,
    counts: contextCounts,
    columnCounts: contextColumnCounts,
    column: columnConfig,
    group: groupConfig,
  } = context;

  const { controller } = useDataViewSetup();
  if (controller.type === "page") {
    throw new Error(
      "BoardView requires an InfiniteController. " +
        "Use useInfiniteController() instead of usePageController(). " +
        "Board views only support infinite pagination modes (loadMore, infiniteScroll)."
    );
  }

  // Get sort order from URL params (managed by useGroupParams)
  const { groupSortOrder } = useGroupParams();

  const columnCounts = options?.columnCounts ?? contextColumnCounts;
  const columnSortValues = contextCounts?.groupSortValues;
  const groupCounts = contextCounts?.group;

  const propertyValidationError = useMemo(
    () => validatePropertyKeys(properties),
    [properties]
  );

  const columnProperty = useMemo(
    () =>
      columnConfig?.propertyId
        ? properties.find((p) => String(p.id) === columnConfig.propertyId)
        : undefined,
    [columnConfig, properties]
  );

  const rowGroupProperty = useMemo(
    () =>
      groupConfig?.propertyId
        ? properties.find((p) => String(p.id) === groupConfig.propertyId)
        : undefined,
    [groupConfig, properties]
  );

  const columns = useMemo(
    () =>
      buildGroupItems<TData>(columnCounts, {
        sortOrder: groupSortOrder,
        sortValues: columnSortValues,
      }),
    [columnCounts, columnSortValues, groupSortOrder]
  );

  const rowGroups = useMemo(
    () =>
      buildGroupItems<TData>(groupCounts, {
        hideEmpty: groupConfig?.hideEmpty ?? false,
        sortOrder: groupConfig?.sort ?? "asc",
        sortValues: columnSortValues,
      }),
    [groupCounts, columnSortValues, groupConfig?.sort, groupConfig?.hideEmpty]
  );

  const columnOptions = useMemo(
    () =>
      getGroupOptions(columnProperty as DataViewProperty<unknown> | undefined),
    [columnProperty]
  );

  return {
    ...context,
    columnCounts,
    columnOptions,
    columnProperty,
    columns,
    propertyValidationError,
    rowGroupProperty,
    rowGroups,
  };
}
