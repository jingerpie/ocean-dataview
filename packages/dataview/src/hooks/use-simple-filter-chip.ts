import { create } from "zustand";

interface SimpleFilterChipState {
	/** The property ID of the currently open filter chip, or null if none is open */
	openPropertyId: string | null;
	/** Open a filter chip by property ID */
	open: (propertyId: string) => void;
	/** Close the currently open filter chip */
	close: () => void;
	/** Set the open property ID directly (null to close) */
	setOpen: (propertyId: string | null) => void;
}

export const useSimpleFilterChip = create<SimpleFilterChipState>((set) => ({
	openPropertyId: null,
	open: (propertyId) => set({ openPropertyId: propertyId }),
	close: () => set({ openPropertyId: null }),
	setOpen: (propertyId) => set({ openPropertyId: propertyId }),
}));
