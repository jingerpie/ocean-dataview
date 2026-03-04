"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { GroupConfig, PropertyMeta } from "../../types";

// ============================================================================
// Types
// ============================================================================

/**
 * Toolbar context value - non-suspending state for toolbar components.
 */
export interface ToolbarContextValue {
  /** Current group config (for deriving group property label) */
  group: GroupConfig | null | undefined;
  /** Hide all properties */
  hideAllProperties: () => void;
  /** Array of property metadata */
  properties: readonly PropertyMeta[];
  /** Array of currently visible property IDs */
  propertyVisibility: string[];
  /** Set the full list of visible property IDs */
  setPropertyVisibility: (ids: string[]) => void;
  /** Show all properties */
  showAllProperties: () => void;
  /** Toggle visibility of a single property */
  toggleProperty: (id: string) => void;
}

// ============================================================================
// Context
// ============================================================================

export const ToolbarContext = createContext<ToolbarContextValue | undefined>(
  undefined
);

/**
 * Hook to access toolbar context.
 * Throws if used outside ToolbarContextProvider.
 */
export function useToolbarContext(): ToolbarContextValue {
  const context = useContext(ToolbarContext);
  if (!context) {
    throw new Error("useToolbarContext must be used within DataViewProvider");
  }
  return context;
}

/**
 * Hook to optionally access toolbar context.
 * Returns undefined if used outside ToolbarContextProvider.
 */
export function useToolbarContextOptional(): ToolbarContextValue | undefined {
  return useContext(ToolbarContext);
}

// ============================================================================
// Provider
// ============================================================================

interface ToolbarContextProviderProps {
  children: React.ReactNode;
  /** Default visibility - if not provided, all non-hidden properties are visible */
  defaultVisibility?: string[];
  /** Group config (passed to toolbar for deriving group property label) */
  group?: GroupConfig | null;
  /** Property definitions */
  properties: readonly PropertyMeta[];
}

/**
 * Provider for toolbar-specific state.
 * This is non-suspending and renders immediately.
 */
export function ToolbarContextProvider({
  children,
  defaultVisibility,
  group,
  properties,
}: ToolbarContextProviderProps) {
  // Get all property IDs that CAN be visible (hidden !== true in definition)
  const visiblePropertyIds = useMemo(
    () => properties.filter((p) => p.hidden !== true).map((p) => String(p.id)),
    [properties]
  );

  // Store only user overrides (properties explicitly hidden by user)
  const [hiddenByUser, setHiddenByUser] = useState<Set<string>>(() => {
    if (defaultVisibility) {
      const defaultVisible = new Set(defaultVisibility);
      return new Set(
        visiblePropertyIds.filter((id) => !defaultVisible.has(id))
      );
    }
    return new Set();
  });

  // Derive visible properties from property definitions + user overrides
  const propertyVisibility = useMemo(
    () => visiblePropertyIds.filter((id) => !hiddenByUser.has(id)),
    [visiblePropertyIds, hiddenByUser]
  );

  const setPropertyVisibility = useCallback(
    (visible: string[]) => {
      const visibleSet = new Set(visible);
      setHiddenByUser(
        new Set(visiblePropertyIds.filter((id) => !visibleSet.has(id)))
      );
    },
    [visiblePropertyIds]
  );

  const toggleProperty = useCallback((propertyId: string) => {
    setHiddenByUser((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) {
        next.delete(propertyId);
      } else {
        next.add(propertyId);
      }
      return next;
    });
  }, []);

  const showAllProperties = useCallback(() => {
    setHiddenByUser(new Set());
  }, []);

  const hideAllProperties = useCallback(() => {
    setHiddenByUser(new Set(visiblePropertyIds));
  }, [visiblePropertyIds]);

  const value = useMemo<ToolbarContextValue>(
    () => ({
      group,
      hideAllProperties,
      properties,
      propertyVisibility,
      setPropertyVisibility,
      showAllProperties,
      toggleProperty,
    }),
    [
      group,
      hideAllProperties,
      properties,
      propertyVisibility,
      setPropertyVisibility,
      showAllProperties,
      toggleProperty,
    ]
  );

  return (
    <ToolbarContext.Provider value={value}>{children}</ToolbarContext.Provider>
  );
}
