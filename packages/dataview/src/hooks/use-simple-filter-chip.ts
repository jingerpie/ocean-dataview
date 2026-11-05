import { useMemo } from "react";
import { useToolbarPopoverState } from "../lib/providers/toolbar-popover-context";

interface SimpleFilterChipState {
  /** Close the currently open filter chip */
  close: () => void;
  /** Open a filter chip by property ID */
  open: (propertyId: string) => void;
  /** The property ID of the currently open filter chip, or null if none is open */
  openPropertyId: string | null;
  /** Set the open property ID directly (null to close) */
  setOpen: (propertyId: string | null) => void;
}

/**
 * Open simple filter chip for the enclosing DataViewProvider.
 */
export function useSimpleFilterChip(): SimpleFilterChipState {
  const { openFilterChipId, setOpenFilterChipId } = useToolbarPopoverState();
  return useMemo(
    () => ({
      openPropertyId: openFilterChipId,
      open: (propertyId) => setOpenFilterChipId(propertyId),
      close: () => setOpenFilterChipId(null),
      setOpen: setOpenFilterChipId,
    }),
    [openFilterChipId, setOpenFilterChipId]
  );
}
