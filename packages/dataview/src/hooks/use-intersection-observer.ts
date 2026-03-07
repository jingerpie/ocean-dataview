"use client";

import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
  /**
   * Root element for intersection calculation
   * @default null (viewport)
   */
  root?: Element | null;
  /**
   * Margin around the root element
   * @default "0px"
   */
  rootMargin?: string;
  /**
   * Percentage of target visibility to trigger
   * @default 0
   */
  threshold?: number | number[];
}

/**
 * Hook for observing element intersection with viewport or container.
 *
 * @example
 * ```tsx
 * const { targetRef, isIntersecting } = useIntersectionObserver({
 *   rootMargin: "100px",
 * });
 *
 * useEffect(() => {
 *   if (isIntersecting && hasNext && !isFetching) {
 *     loadMore();
 *   }
 * }, [isIntersecting, hasNext, isFetching]);
 *
 * return <div ref={targetRef} />;
 * ```
 */
export function useIntersectionObserver({
  root = null,
  rootMargin = "0px",
  threshold = 0,
}: UseIntersectionObserverOptions = {}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsIntersecting(entry.isIntersecting);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold]);

  return { targetRef, isIntersecting };
}
