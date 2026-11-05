"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Open state for toolbar popovers that can be opened from elsewhere
 * (for example, the sort tool opens the sort chip).
 *
 * Scoped per DataViewProvider so two views on one page stay independent.
 */
export interface ToolbarPopoverState {
  /** Whether the advanced filter builder is open */
  advancedFilterOpen: boolean;
  /** The property ID of the open simple filter chip, or null */
  openFilterChipId: string | null;
  setAdvancedFilterOpen: (open: boolean) => void;
  setOpenFilterChipId: (propertyId: string | null) => void;
  setSortBuilderOpen: (open: boolean) => void;
  /** Whether the sort builder is open */
  sortBuilderOpen: boolean;
}

// ============================================================================
// Context
// ============================================================================

const ToolbarPopoverContext = createContext<ToolbarPopoverState | undefined>(
  undefined
);

/**
 * Hook to access toolbar popover state.
 * Throws if used outside DataViewProvider.
 */
export function useToolbarPopoverState(): ToolbarPopoverState {
  const context = useContext(ToolbarPopoverContext);
  if (!context) {
    throw new Error(
      "useToolbarPopoverState must be used within DataViewProvider"
    );
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

export function ToolbarPopoverProvider({ children }: { children: ReactNode }) {
  const [sortBuilderOpen, setSortBuilderOpen] = useState(false);
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [openFilterChipId, setOpenFilterChipId] = useState<string | null>(null);

  const value = useMemo<ToolbarPopoverState>(
    () => ({
      advancedFilterOpen,
      openFilterChipId,
      setAdvancedFilterOpen,
      setOpenFilterChipId,
      setSortBuilderOpen,
      sortBuilderOpen,
    }),
    [advancedFilterOpen, openFilterChipId, sortBuilderOpen]
  );

  return (
    <ToolbarPopoverContext.Provider value={value}>
      {children}
    </ToolbarPopoverContext.Provider>
  );
}
