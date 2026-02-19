import { create } from "zustand";

interface AdvanceFilterBuilderState {
  close: () => void;
  isOpen: boolean;
  open: () => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useAdvanceFilterBuilder = create<AdvanceFilterBuilderState>(
  (set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    setOpen: (open) => set({ isOpen: open }),
  })
);
