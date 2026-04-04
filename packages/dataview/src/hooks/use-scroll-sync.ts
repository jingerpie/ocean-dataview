"use client";

import { useCallback, useRef } from "react";

/**
 * useScrollSync - Synchronizes horizontal scrollLeft across multiple containers.
 *
 * Returns a `register` function. Call `register(element)` to add a container;
 * it returns a cleanup function. When any registered container scrolls
 * horizontally, all others are updated to the same scrollLeft.
 */
export function useScrollSync() {
  const stateRef = useRef({
    scrollLeft: 0,
    isUpdating: false,
    elements: new Map<HTMLElement, () => void>(),
  });

  const register = useCallback((el: HTMLElement) => {
    const state = stateRef.current;

    // Already registered
    const existing = state.elements.get(el);
    if (existing) {
      return existing;
    }

    // Initialize position
    el.scrollLeft = state.scrollLeft;

    const handler = () => {
      if (state.isUpdating) {
        return;
      }
      state.isUpdating = true;
      state.scrollLeft = el.scrollLeft;
      for (const [other] of state.elements) {
        if (other !== el && other.scrollLeft !== el.scrollLeft) {
          other.scrollLeft = el.scrollLeft;
        }
      }
      state.isUpdating = false;
    };

    el.addEventListener("scroll", handler, { passive: true });

    const cleanup = () => {
      el.removeEventListener("scroll", handler);
      state.elements.delete(el);
    };

    state.elements.set(el, cleanup);
    return cleanup;
  }, []);

  return { register, stateRef };
}
