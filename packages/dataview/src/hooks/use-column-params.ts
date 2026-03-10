"use client";

import type {
  ColumnConfigInput,
  GroupByConfig,
} from "@sparkyidea/shared/types";
import { parseAsColumnBy } from "@sparkyidea/shared/utils/parsers/column";
import { useQueryState } from "nuqs";
import { useCallback } from "react";

const THROTTLE_MS = 50;

/**
 * Hook for managing column configuration via URL (board-specific).
 *
 * Uses URL as source of truth with shallow: true (default).
 * All actions update URL immediately (no debouncing needed).
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
  // URL state - source of truth
  const [column, setUrlColumn] = useQueryState(
    "column",
    parseAsColumnBy.withOptions({ throttleMs: THROTTLE_MS })
  );

  // Set column configuration (replaces entire config)
  const setColumn = useCallback(
    (newColumn: GroupByConfig | null) => {
      if (!newColumn) {
        void setUrlColumn(null);
        return;
      }

      // Preserve existing sort/hideEmpty when changing column type
      const config: ColumnConfigInput = {
        ...newColumn,
        sort: column?.sort,
        hideEmpty: column?.hideEmpty,
      };

      void setUrlColumn(config);
    },
    [column, setUrlColumn]
  );

  // Clear column (remove column grouping)
  const clearColumn = useCallback(() => {
    void setUrlColumn(null);
  }, [setUrlColumn]);

  // Set sort order
  const setColumnSortOrder = useCallback(
    (sort: "asc" | "desc") => {
      if (!column) {
        return;
      }
      void setUrlColumn({ ...column, sort });
    },
    [column, setUrlColumn]
  );

  // Set hide empty columns
  const setHideEmptyColumns = useCallback(
    (hideEmpty: boolean) => {
      if (!column) {
        return;
      }
      void setUrlColumn({ ...column, hideEmpty });
    },
    [column, setUrlColumn]
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
