"use client";

import { createContext, type RefObject, useContext } from "react";

/**
 * Context for sharing the group accordion trigger ref with children components.
 * Used by DataTable for sticky header positioning calculations.
 */
const GroupTriggerRefContext =
	createContext<RefObject<HTMLButtonElement | null> | null>(null);

/**
 * Hook to access the group trigger ref from within a GroupSection.
 * Returns null when not inside a GroupSection.
 */
export const useGroupTriggerRef = () => useContext(GroupTriggerRefContext);

export const GroupTriggerRefProvider = GroupTriggerRefContext.Provider;
