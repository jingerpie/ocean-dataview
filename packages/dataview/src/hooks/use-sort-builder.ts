import { create } from "zustand";

interface SortBuilderState {
	isOpen: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
	setOpen: (open: boolean) => void;
}

export const useSortBuilder = create<SortBuilderState>((set) => ({
	isOpen: false,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false }),
	toggle: () => set((state) => ({ isOpen: !state.isOpen })),
	setOpen: (open) => set({ isOpen: open }),
}));
