"use client";

import { useCallback } from "react";
import {
  useQueryParamsActions,
  useQueryParamsState,
} from "../lib/providers/query-params-context";
import type { ColumnConfigInput, GroupByConfig } from "../types/group.type";

/**
 * Hook for managing column configuration via URL (board-specific).
 *
 * Reads from QueryParamsContext (single source of truth for validated state).
 *
 * Columns are board-specific groupings that define the visual columns.
 * This is separate from group (accordion rows) which is shared across views.
 *
 * @example
 * ```ts
 * const { column, setColumn, clearColumn } = useColumnParams();
 * ```
 */
export function useColumnParams() {
  const { column } = useQueryParamsState();
  const { setColumn: setColumnBase } = useQueryParamsActions();

  // Set column configuration (replaces entire config)
  const setColumn = useCallback(
    (newColumn: GroupByConfig | null) => {
      if (!newColumn) {
        setColumnBase(null);
        return;
      }

      // Preserve existing sort/hideEmpty when changing column type
      const config: ColumnConfigInput = {
        ...newColumn,
        sort: column?.sort,
        hideEmpty: column?.hideEmpty,
      };

      setColumnBase(config);
    },
    [column, setColumnBase]
  );

  // Clear column (remove column grouping)
  const clearColumn = useCallback(() => {
    setColumnBase(null);
  }, [setColumnBase]);

  // Set sort order
  const setColumnSortOrder = useCallback(
    (sort: "asc" | "desc") => {
      if (!column) {
        return;
      }
      setColumnBase({ ...column, sort });
    },
    [column, setColumnBase]
  );

  // Set hide empty columns
  const setHideEmptyColumns = useCallback(
    (hideEmpty: boolean) => {
      if (!column) {
        return;
      }
      setColumnBase({ ...column, hideEmpty });
    },
    [column, setColumnBase]
  );

  // Extract property from column config using canonical propertyId field
  const columnProperty = column?.propertyId ?? null;

  // Extract column type from config using canonical propertyType field
  const columnType = column?.propertyType ?? null;

  // Get sort order (defaults to "asc")
  const columnSortOrder = column?.sort ?? "asc";

  return {
    column,
    setColumn,
    clearColumn,
    columnProperty,
    columnType,
    hasColumn: column !== null,
    columnSortOrder,
    setColumnSortOrder,
    hideEmptyColumns: column?.hideEmpty ?? false,
    setHideEmptyColumns,
  };
}
