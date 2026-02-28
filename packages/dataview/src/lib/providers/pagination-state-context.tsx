"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Pagination state exposed to consumers via context.
 * Access these values inside DataViewProvider using usePaginationState().
 */
export interface PaginationStateContextValue {
  /** True when no data has been loaded yet (show skeleton) */
  isEmpty: boolean;
  /** True when any group is loading (fetching or pending) */
  isLoading: boolean;
  /** True when showing stale data while refetching (dim content) */
  isPlaceholderData: boolean;
}

// ============================================================================
// Context
// ============================================================================

const PaginationStateContext = createContext<
  PaginationStateContextValue | undefined
>(undefined);

/**
 * usePaginationState - Access pagination loading states inside DataViewProvider.
 *
 * Must be called from a component rendered INSIDE DataViewProvider.
 * This allows loading states to be reactive without causing re-renders
 * in the parent hook.
 *
 * @example
 * ```tsx
 * function TableContent() {
 *   const { isLoading, isEmpty, isPlaceholderData } = usePaginationState();
 *
 *   if (isLoading && isEmpty) {
 *     return <TableSkeleton />;
 *   }
 *
 *   return (
 *     <div style={{ opacity: isPlaceholderData ? 0.7 : 1 }}>
 *       <TableView />
 *     </div>
 *   );
 * }
 * ```
 */
export function usePaginationState(): PaginationStateContextValue {
  const context = useContext(PaginationStateContext);
  if (!context) {
    throw new Error(
      "usePaginationState must be used within a DataViewProvider created by usePagePagination"
    );
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

interface PaginationStateProviderProps {
  children: ReactNode;
  isEmpty: boolean;
  isLoading: boolean;
  isPlaceholderData: boolean;
}

/**
 * PaginationStateProvider - Internal provider for pagination loading states.
 * Used by usePagePagination to expose states to children via context.
 */
export function PaginationStateProvider({
  children,
  isEmpty,
  isLoading,
  isPlaceholderData,
}: PaginationStateProviderProps) {
  const value = useMemo<PaginationStateContextValue>(
    () => ({ isEmpty, isLoading, isPlaceholderData }),
    [isEmpty, isLoading, isPlaceholderData]
  );

  return (
    <PaginationStateContext.Provider value={value}>
      {children}
    </PaginationStateContext.Provider>
  );
}
