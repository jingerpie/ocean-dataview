import { useMemo } from "react";
import { useToolbarPopoverState } from "../providers/toolbar-popover-context";

interface AdvanceFilterBuilderState {
  close: () => void;
  isOpen: boolean;
  open: () => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

/**
 * Open state of the advanced filter builder for the enclosing DataViewProvider.
 */
export function useAdvanceFilterBuilder(): AdvanceFilterBuilderState {
  const { advancedFilterOpen, setAdvancedFilterOpen } =
    useToolbarPopoverState();
  return useMemo(
    () => ({
      isOpen: advancedFilterOpen,
      open: () => setAdvancedFilterOpen(true),
      close: () => setAdvancedFilterOpen(false),
      toggle: () => setAdvancedFilterOpen(!advancedFilterOpen),
      setOpen: setAdvancedFilterOpen,
    }),
    [advancedFilterOpen, setAdvancedFilterOpen]
  );
}
