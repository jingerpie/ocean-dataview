import { useMemo } from "react";
import { useToolbarPopoverState } from "../providers/toolbar-popover-context";

interface SortBuilderState {
  close: () => void;
  isOpen: boolean;
  open: () => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

/**
 * Open state of the sort builder for the enclosing DataViewProvider.
 */
export function useSortBuilder(): SortBuilderState {
  const { sortBuilderOpen, setSortBuilderOpen } = useToolbarPopoverState();
  return useMemo(
    () => ({
      isOpen: sortBuilderOpen,
      open: () => setSortBuilderOpen(true),
      close: () => setSortBuilderOpen(false),
      toggle: () => setSortBuilderOpen(!sortBuilderOpen),
      setOpen: setSortBuilderOpen,
    }),
    [sortBuilderOpen, setSortBuilderOpen]
  );
}
