"use client";

import { useCallback, useRef } from "react";

export interface ScrollSync {
  /** Widest scrollWidth among registered containers, excluding `except` */
  measureContentWidth: (except?: HTMLElement) => number;
  /** Add a container; returns its cleanup */
  register: (el: HTMLElement) => () => void;
  /** Listen for containers being added, removed, or resized */
  subscribe: (listener: () => void) => () => void;
}

/**
 * useScrollSync - Synchronizes horizontal scrollLeft across multiple containers.
 *
 * Call `register(element)` to add a container; it returns a cleanup
 * function. When any registered container scrolls horizontally, all others
 * are updated to the same scrollLeft.
 */
export function useScrollSync(): ScrollSync {
  const stateRef = useRef({
    scrollLeft: 0,
    isUpdating: false,
    elements: new Map<HTMLElement, () => void>(),
    listeners: new Set<() => void>(),
    resizeObserver: null as ResizeObserver | null,
  });

  const notify = useCallback(() => {
    for (const listener of stateRef.current.listeners) {
      listener();
    }
  }, []);

  const getResizeObserver = useCallback(() => {
    const state = stateRef.current;
    if (!state.resizeObserver && typeof ResizeObserver !== "undefined") {
      state.resizeObserver = new ResizeObserver(notify);
    }
    return state.resizeObserver;
  }, [notify]);

  const register = useCallback(
    (el: HTMLElement) => {
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
      const resizeObserver = getResizeObserver();
      const content = el.firstElementChild;
      if (content) {
        resizeObserver?.observe(content);
      }

      const cleanup = () => {
        el.removeEventListener("scroll", handler);
        if (content) {
          resizeObserver?.unobserve(content);
        }
        state.elements.delete(el);
        notify();
      };

      state.elements.set(el, cleanup);
      notify();
      return cleanup;
    },
    [getResizeObserver, notify]
  );

  const subscribe = useCallback((listener: () => void) => {
    const { listeners } = stateRef.current;
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const measureContentWidth = useCallback((except?: HTMLElement) => {
    let width = 0;
    for (const [el] of stateRef.current.elements) {
      if (el !== except) {
        width = Math.max(width, el.scrollWidth);
      }
    }
    return width;
  }, []);

  return { measureContentWidth, register, subscribe };
}
