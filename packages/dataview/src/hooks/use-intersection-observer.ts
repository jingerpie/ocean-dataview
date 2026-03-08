"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseIntersectionObserverOptions {
  /** Callback fired when element enters viewport */
  onVisible?: () => void;
  /** Recheck intersection when these change (e.g., [isFetching] to handle cached loads) */
  recheckOn?: unknown[];
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Hook for observing element intersection with viewport.
 * Uses callback ref to ensure observer attaches exactly when DOM mounts.
 */
export function useIntersectionObserver({
  root = null,
  rootMargin = "0px",
  threshold = 0,
  onVisible,
  recheckOn = [],
}: UseIntersectionObserverOptions = {}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  // Ref ensures latest callback without recreating observer
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  // Callback ref - fires exactly when DOM node mounts/unmounts
  const targetRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      nodeRef.current = node;

      if (!node) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            onVisibleRef.current?.();
          }
        },
        { root, rootMargin, threshold }
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [root, rootMargin, threshold]
  );

  // Recheck intersection when recheckOn deps change (handles cached instant loads)
  useEffect(() => {
    const node = nodeRef.current;
    const observer = observerRef.current;
    if (node && observer) {
      observer.disconnect();
      observer.observe(node);
    }
  }, recheckOn);

  // Cleanup on unmount
  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { targetRef };
}
