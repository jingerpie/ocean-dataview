"use client";

import type {
  ColumnDef,
  RowSelectionState,
  Table as TanStackTable,
} from "@tanstack/react-table";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDisplayProperties } from "../../../hooks/use-display-properties";
import type { GroupedDataItem } from "../../../hooks/use-group-config";
import type { UseGroupQueryResult } from "../../../hooks/use-group-query";
import type { UseInfiniteGroupQueryResult } from "../../../hooks/use-infinite-group-query";
import { useScrollSync } from "../../../hooks/use-scroll-sync";
import { useViewSetup } from "../../../hooks/use-view-setup";
import { useDataViewContext } from "../../../lib/providers/data-view-context";
import type { BulkAction } from "../../../types/action.type";
import type { PaginationContext } from "../../../types/pagination";
import type { DataViewProperty } from "../../../types/property.type";
import { transformData } from "../../../utils/transform-data";
import { Accordion } from "../../ui/accordion";
import {
  DataActionBar,
  DataActionBarAction,
  DataActionBarSelection,
} from "../../ui/bulk-actions";
import { Checkbox } from "../../ui/checkbox";
import { GroupSection } from "../../ui/group-section";
import { Pagination, type PaginationMode } from "../../ui/pagination";
import {
  SuspendingGroupContent,
  SuspendingInfiniteGroupContent,
} from "../../ui/suspending-group-content";
import { DataCell } from "../data-cell";
import { DataTable } from "./data-table";
import { TableSkeleton } from "./table-skeleton";

export interface TableViewProps<TData> {
  /**
   * Bulk actions for operations on selected rows.
   * When provided, automatically enables:
   * - Row selection with checkboxes
   * - Floating action bar for bulk operations
   *
   * For row-level actions, use button property type instead.
   */
  bulkActions?: BulkAction<TData>[];

  /**
   * Row click handler
   */
  onRowClick?: (row: TData) => void;

  /**
   * Pagination mode for the table.
   * - "page": Classic prev/next pagination with "Showing X-Y"
   * - "loadMore": "Load more" button
   * - "infiniteScroll": Auto-load on scroll
   * - undefined: No pagination UI
   *
   * For grouped tables: renders inside each group
   * For flat tables: renders below the table
   */
  pagination?: PaginationMode;

  /**
   * Default for showing property names in column headers.
   * Per-property `showName` overrides this.
   * @default true
   */
  showPropertyNames?: boolean;

  /**
   * Show vertical lines between columns
   * @default true
   */
  showVerticalLines?: boolean;

  /**
   * Sticky header configuration.
   * @default { enabled: false }
   */
  stickyHeader?: { enabled: boolean; offset?: number };

  /**
   * Default for wrapping text in cells.
   * Per-property `wrap` overrides this.
   * @default true
   */
  wrapAllProperties?: boolean;
}

/**
 * TableView - Spreadsheet-style data display
 * Auto-generates columns from properties
 * Supports row selection and action bars
 */
export function TableView<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = DataViewProperty<TData>[],
>({
  bulkActions,
  onRowClick,
  pagination,
  showPropertyNames = true,
  showVerticalLines = true,
  stickyHeader: stickyHeaderProp,
  wrapAllProperties = true,
}: TableViewProps<TData>) {
  const stickyEnabled = stickyHeaderProp?.enabled ?? false;
  const stickyOffset = stickyHeaderProp?.offset ?? 0;
  const { register: registerScroll } = useScrollSync();

  // Get data and properties from context
  const {
    data,
    limit,
    properties,
    propertyVisibility,
    pagination: contextPagination,
    counts,
    group,
    groupKeys,
    expandedGroups,
    onExpandedGroupsChange,
    hasNextGroupPage,
    isFetchingNextGroupPage,
    onLoadMoreGroups,
  } = useDataViewContext<TData, TProperties>();

  // Use shared view setup hook
  const {
    groupedData,
    groupByProperty,
    validationError,
    propertyValidationError,
  } = useViewSetup({
    data: data as TData[],
    properties,
    group,
    contextPagination,
    counts,
  });

  // Enable row selection when bulkActions are provided
  const enableRowSelection = Boolean(bulkActions && bulkActions.length > 0);

  // Internal row selection state (always internal when using bulkActions)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Use shared hook for display properties filtering
  const displayProperties = useDisplayProperties(
    properties,
    propertyVisibility
  );

  // Determine if we're using infinite pagination for data
  const useInfinitePagination =
    pagination === "loadMore" || pagination === "infiniteScroll";

  // Generate columns from properties
  const columns = useMemo<ColumnDef<TData>[]>(() => {
    const propertyColumns: ColumnDef<TData>[] = displayProperties.map(
      (property) => {
        const resolvedShowName = property.showName ?? showPropertyNames;
        const resolvedWrap = property.wrap ?? wrapAllProperties;

        return {
          id: String(property.id),
          accessorKey: String(property.id),
          header: resolvedShowName
            ? (property.name ?? String(property.id))
            : "",
          cell: ({ getValue, row }) => (
            <DataCell
              allProperties={properties}
              item={row.original}
              property={property}
              value={getValue()}
            />
          ),
          meta: {
            propertyType: property.type,
            wrap: resolvedWrap,
          },
        };
      }
    );

    const allColumns: ColumnDef<TData>[] = [];

    // Add selection column if rowActions provided
    if (enableRowSelection) {
      allColumns.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              !table.getIsAllPageRowsSelected() &&
              table.getIsSomePageRowsSelected()
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      });
    }

    // Add property columns
    allColumns.push(...propertyColumns);

    return allColumns;
  }, [displayProperties, properties, enableRowSelection]);

  // Generate action bar if bulkActions provided
  const actionBar = useMemo(() => {
    if (!bulkActions || bulkActions.length === 0) {
      return undefined;
    }

    // Capture bulkActions in closure to satisfy TypeScript
    const actions = bulkActions;

    function TableActionBar(table: TanStackTable<TData>) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((r) => r.original);

      return (
        <DataActionBar table={table}>
          <DataActionBarSelection table={table} />
          {actions.map((action) => (
            <DataActionBarAction
              isPending={action.isPending}
              key={action.label}
              onClick={() => action.onClick(selectedRows)}
              tooltip={action.label}
            >
              {action.icon}
              {action.label}
            </DataActionBarAction>
          ))}
        </DataActionBar>
      );
    }

    return TableActionBar;
  }, [bulkActions]);

  // Error state
  if (validationError || propertyValidationError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 p-8">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="font-medium text-destructive">
          Invalid table configuration
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          {validationError || propertyValidationError}
        </p>
      </div>
    );
  }

  // GROUPED VIEW with Per-Group Suspense
  if (group && groupKeys && groupKeys.length > 0) {
    return (
      <div className="flex flex-col">
        <Accordion
          multiple
          onValueChange={onExpandedGroupsChange}
          value={expandedGroups ?? []}
        >
          {groupedData?.map((groupItem: GroupedDataItem<TData>) => {
            const isExpanded = expandedGroups?.includes(groupItem.key) ?? false;

            return (
              <GroupSection
                group={groupItem}
                groupByPropertyDef={groupByProperty}
                key={groupItem.key}
                showAggregation={group.showCount ?? true}
                stickyHeader={{ enabled: stickyEnabled, offset: stickyOffset }}
              >
                {isExpanded ? (
                  <Suspense
                    fallback={
                      <TableSkeleton
                        propertyTypes={displayProperties.map((p) => p.type)}
                        rowCount={limit ?? TableView.defaultLimit}
                        withBulkActions={enableRowSelection}
                      />
                    }
                  >
                    {useInfinitePagination ? (
                      <SuspendingInfiniteTableContent<TData, TProperties>
                        actionBar={actionBar}
                        columns={columns}
                        enableRowSelection={enableRowSelection}
                        groupItem={groupItem}
                        headerOffset={stickyOffset + 44}
                        hideScrollbar
                        onRowClick={onRowClick}
                        onRowSelectionChange={setRowSelection}
                        pagination={pagination}
                        properties={properties}
                        registerScroll={registerScroll}
                        rowSelection={rowSelection}
                        showVerticalLines={showVerticalLines}
                        stickyEnabled={stickyEnabled}
                        wrapAllProperties={wrapAllProperties}
                      />
                    ) : (
                      <SuspendingPageTableContent<TData, TProperties>
                        actionBar={actionBar}
                        columns={columns}
                        enableRowSelection={enableRowSelection}
                        groupItem={groupItem}
                        headerOffset={stickyOffset + 44}
                        hideScrollbar
                        onRowClick={onRowClick}
                        onRowSelectionChange={setRowSelection}
                        pagination={pagination}
                        properties={properties}
                        registerScroll={registerScroll}
                        rowSelection={rowSelection}
                        showVerticalLines={showVerticalLines}
                        stickyEnabled={stickyEnabled}
                        wrapAllProperties={wrapAllProperties}
                      />
                    )}
                  </Suspense>
                ) : null}
              </GroupSection>
            );
          })}
        </Accordion>

        {/* Infinite scroll sentinel for groups */}
        <InfiniteScrollGroupsSentinel
          hasNext={hasNextGroupPage}
          isFetching={isFetchingNextGroupPage}
          onLoadMore={onLoadMoreGroups}
        />

        {/* Shared horizontal scrollbar for all grouped tables */}
        <ScrollSyncBar register={registerScroll} />
      </div>
    );
  }

  // FLAT VIEW: Uses SuspendingGroupContent with __ungrouped__ key
  return (
    <Suspense
      fallback={
        <TableSkeleton
          pagination={pagination}
          propertyTypes={displayProperties.map((p) => p.type)}
          rowCount={limit ?? TableView.defaultLimit}
          withBulkActions={enableRowSelection}
        />
      }
    >
      {useInfinitePagination ? (
        <SuspendingInfiniteTableContent<TData, TProperties>
          actionBar={actionBar}
          columns={columns}
          enableRowSelection={enableRowSelection}
          groupItem={{
            key: "__ungrouped__",
            items: [],
            count: 0,
            displayCount: "0",
            sortValue: "",
          }}
          headerOffset={stickyOffset}
          onRowClick={onRowClick}
          onRowSelectionChange={setRowSelection}
          pagination={pagination}
          properties={properties}
          registerScroll={registerScroll}
          rowSelection={rowSelection}
          showVerticalLines={showVerticalLines}
          stickyEnabled={stickyEnabled}
          wrapAllProperties={wrapAllProperties}
        />
      ) : (
        <SuspendingPageTableContent<TData, TProperties>
          actionBar={actionBar}
          columns={columns}
          enableRowSelection={enableRowSelection}
          groupItem={{
            key: "__ungrouped__",
            items: [],
            count: 0,
            displayCount: "0",
            sortValue: "",
          }}
          headerOffset={stickyOffset}
          onRowClick={onRowClick}
          onRowSelectionChange={setRowSelection}
          pagination={pagination}
          properties={properties}
          registerScroll={registerScroll}
          rowSelection={rowSelection}
          showVerticalLines={showVerticalLines}
          stickyEnabled={stickyEnabled}
          wrapAllProperties={wrapAllProperties}
        />
      )}
    </Suspense>
  );
}

// Static marker for view type detection in DataViewProvider
TableView.dataViewType = "table" as const;
TableView.defaultLimit = 25;

// ============================================================================
// Suspending Group Content Components
// ============================================================================

interface SuspendingGroupTableContentProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  actionBar?: (table: TanStackTable<TData>) => React.ReactNode;
  columns: ColumnDef<TData>[];
  enableRowSelection: boolean;
  groupItem: GroupedDataItem<TData>;
  /** Offset for sticky header */
  headerOffset: number;
  /** Hide individual scrollbars (shared scrollbar provided at view level) */
  hideScrollbar?: boolean;
  onRowClick?: (row: TData) => void;
  onRowSelectionChange: (state: RowSelectionState) => void;
  pagination?: PaginationMode;
  properties: TProperties;
  /** External scroll sync registration for cross-group horizontal scroll */
  registerScroll?: (el: HTMLElement) => () => void;
  rowSelection: RowSelectionState;
  showVerticalLines: boolean;
  stickyEnabled: boolean;
  wrapAllProperties: boolean;
}

/**
 * Table content renderer - used by both page and infinite pagination variants.
 */
function TableContentRenderer<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  actionBar,
  columns,
  data,
  enableRowSelection,
  headerOffset,
  hideScrollbar,
  onRowClick,
  onRowSelectionChange,
  paginationNode,
  properties,
  registerScroll,
  rowSelection,
  showVerticalLines,
  stickyEnabled,
  wrapAllProperties,
}: {
  actionBar?: (table: TanStackTable<TData>) => React.ReactNode;
  columns: ColumnDef<TData>[];
  data: TData[];
  enableRowSelection: boolean;
  headerOffset: number;
  hideScrollbar?: boolean;
  onRowClick?: (row: TData) => void;
  onRowSelectionChange: (state: RowSelectionState) => void;
  paginationNode: React.ReactNode;
  properties: TProperties;
  registerScroll?: (el: HTMLElement) => () => void;
  rowSelection: RowSelectionState;
  showVerticalLines: boolean;
  stickyEnabled: boolean;
  wrapAllProperties: boolean;
}) {
  // Transform data with property schema
  const transformedItems = transformData(data, properties) as TData[];

  return (
    <>
      <DataTable
        actionBar={actionBar}
        columns={columns}
        data={transformedItems}
        enableRowSelection={enableRowSelection}
        header={{ enabled: true, sticky: stickyEnabled }}
        hideScrollbar={hideScrollbar}
        offset={headerOffset}
        onRowClick={onRowClick}
        onRowSelectionChange={onRowSelectionChange}
        registerScroll={registerScroll}
        rowSelection={rowSelection}
        showVerticalLines={showVerticalLines}
        wrapAllProperties={wrapAllProperties}
      />
      {paginationNode}
    </>
  );
}

/**
 * Page pagination variant - uses useGroupQuery for prev/next navigation.
 */
function SuspendingPageTableContent<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  actionBar,
  columns,
  enableRowSelection,
  groupItem,
  headerOffset,
  hideScrollbar,
  onRowClick,
  onRowSelectionChange,
  pagination,
  properties,
  registerScroll,
  rowSelection,
  showVerticalLines,
  stickyEnabled,
  wrapAllProperties,
}: SuspendingGroupTableContentProps<TData, TProperties>) {
  return (
    <SuspendingGroupContent<TData> groupKey={groupItem.key}>
      {(result: UseGroupQueryResult<TData>) => {
        // Build pagination context from query result
        const paginationContext: PaginationContext = {
          displayEnd: result.displayEnd,
          displayStart: result.displayStart,
          hasMoreThanMax: groupItem.displayCount === "99+",
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
          isFetching: result.isFetching,
          limit: result.limit,
          onLimitChange: result.onLimitChange,
          onNext: () => {
            onRowSelectionChange({});
            result.onNext();
          },
          onPrev: () => {
            onRowSelectionChange({});
            result.onPrev();
          },
          totalCount: groupItem.count,
        };

        return (
          <TableContentRenderer
            actionBar={actionBar}
            columns={columns}
            data={result.data}
            enableRowSelection={enableRowSelection}
            headerOffset={headerOffset}
            hideScrollbar={hideScrollbar}
            onRowClick={onRowClick}
            onRowSelectionChange={onRowSelectionChange}
            paginationNode={
              <Pagination context={paginationContext} mode={pagination} />
            }
            properties={properties}
            registerScroll={registerScroll}
            rowSelection={rowSelection}
            showVerticalLines={showVerticalLines}
            stickyEnabled={stickyEnabled}
            wrapAllProperties={wrapAllProperties}
          />
        );
      }}
    </SuspendingGroupContent>
  );
}

/**
 * Infinite pagination variant - uses useInfiniteGroupQuery for load more / infinite scroll.
 */
function SuspendingInfiniteTableContent<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
>({
  actionBar,
  columns,
  enableRowSelection,
  groupItem,
  headerOffset,
  hideScrollbar,
  onRowClick,
  onRowSelectionChange,
  pagination,
  properties,
  registerScroll,
  rowSelection,
  showVerticalLines,
  stickyEnabled,
  wrapAllProperties,
}: SuspendingGroupTableContentProps<TData, TProperties>) {
  return (
    <SuspendingInfiniteGroupContent<TData> groupKey={groupItem.key}>
      {(result: UseInfiniteGroupQueryResult<TData>) => {
        // hasNextPage can be boolean or Record<string, boolean>
        // Convert to simple boolean for PaginationContext
        const hasNext =
          typeof result.hasNextPage === "boolean"
            ? result.hasNextPage
            : Object.values(result.hasNextPage).some(Boolean);

        // Build pagination context from infinite query result
        // Map infinite query properties to PaginationContext
        const paginationContext: PaginationContext = {
          hasMoreThanMax: groupItem.displayCount === "99+",
          hasNext,
          isFetching: result.isFetching,
          isFetchingNextPage: result.isFetchingNextPage,
          limit: result.limit,
          onLimitChange: result.onLimitChange,
          onNext: result.onLoadMore,
          totalCount: groupItem.count,
        };

        return (
          <TableContentRenderer
            actionBar={actionBar}
            columns={columns}
            data={result.data}
            enableRowSelection={enableRowSelection}
            headerOffset={headerOffset}
            hideScrollbar={hideScrollbar}
            onRowClick={onRowClick}
            onRowSelectionChange={onRowSelectionChange}
            paginationNode={
              <Pagination context={paginationContext} mode={pagination} />
            }
            properties={properties}
            registerScroll={registerScroll}
            rowSelection={rowSelection}
            showVerticalLines={showVerticalLines}
            stickyEnabled={stickyEnabled}
            wrapAllProperties={wrapAllProperties}
          />
        );
      }}
    </SuspendingInfiniteGroupContent>
  );
}

// ============================================================================
// Infinite Scroll Groups Sentinel
// ============================================================================

interface InfiniteScrollGroupsSentinelProps {
  hasNext?: boolean;
  isFetching?: boolean;
  onLoadMore?: () => void;
}

function InfiniteScrollGroupsSentinel({
  hasNext,
  isFetching,
  onLoadMore,
}: InfiniteScrollGroupsSentinelProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Use refs to avoid stale closures in the intersection observer callback
  const stateRef = useRef({ hasNext, isFetching, onLoadMore });
  stateRef.current = { hasNext, isFetching, onLoadMore };

  const handleIntersect = useCallback(() => {
    const { hasNext, isFetching, onLoadMore } = stateRef.current;
    if (hasNext && !isFetching && onLoadMore) {
      onLoadMore();
    }
  }, []);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            handleIntersect();
          }
        },
        {
          rootMargin: "200px",
          threshold: 0,
        }
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [handleIntersect] // Re-bind if handleIntersect changes
  );

  // We need to re-run the intersection observer when isFetching changes
  // to ensure it checks visibility after fetching state resolves from cache hits.
  useEffect(() => {
    // If we're no longer fetching, and we have an observer and a node...
    // Actually, reconnecting the observer will force an immediate intersection check.
    if (
      !isFetching &&
      observerRef.current &&
      observerRef.current.takeRecords().length === 0
    ) {
      // Disconnect and reconnect to force a re-evaluation
      observerRef.current.disconnect();
      const node = document.getElementById("infinite-scroll-sentinel");
      if (node) {
        observerRef.current.observe(node);
      }
    }
  }, [isFetching]);

  if (!(hasNext || isFetching)) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-center py-4"
      id="infinite-scroll-sentinel"
      ref={sentinelRef}
    >
      {isFetching && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Loading more groups...</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Scroll Sync Bar
// ============================================================================

/**
 * ScrollSyncBar - A visible horizontal scrollbar that syncs with all
 * registered scroll containers. Used in grouped mode where individual
 * DataTable scrollbars are hidden.
 *
 * Measures content width from sibling scroll containers via ResizeObserver.
 */
function ScrollSyncBar({
  register,
}: {
  register: (el: HTMLElement) => () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  // Register with scroll sync
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    return register(el);
  }, [register]);

  // Observe any registered scroll container to measure content width
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return;
    }

    const updateWidth = () => {
      // Find any overflow-x-auto container in the parent tree to measure from
      const parent = scrollEl.closest(".flex.flex-col");
      if (!parent) {
        return;
      }
      const container = parent.querySelector<HTMLElement>(".overflow-x-auto");
      if (!container || container === scrollEl) {
        setContentWidth(0);
        return;
      }
      setContentWidth(container.scrollWidth);
    };

    // Delay initial check to allow Suspense children to mount
    const timer = setTimeout(updateWidth, 100);

    const observer = new MutationObserver(updateWidth);
    const parent = scrollEl.closest(".flex.flex-col");
    if (parent) {
      observer.observe(parent, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className="sticky bottom-0 overflow-x-auto"
      ref={scrollRef}
      style={
        contentWidth === 0 ? { visibility: "hidden", height: 0 } : undefined
      }
    >
      <div ref={spacerRef} style={{ width: contentWidth, height: 1 }} />
    </div>
  );
}
