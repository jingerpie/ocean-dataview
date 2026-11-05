import { useCallback } from "react";

/**
 * Returns a function that finds the nearest scrollable ancestor of an element.
 * Falls back to `window` if no scrollable parent is found.
 */
export function useScrollParent() {
  return useCallback((element: HTMLElement): HTMLElement | Window => {
    let parent = element.parentElement;
    while (parent) {
      const overflow = getComputedStyle(parent).overflowY;
      if (
        (overflow === "auto" || overflow === "scroll") &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return window;
  }, []);
}
