"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseLoadMoreSentinelOptions {
  hasNext?: boolean;
  isFetching?: boolean;
  onLoadMore?: () => void;
  /** @default "200px" */
  rootMargin?: string;
}

/**
 * Calls `onLoadMore` when the returned ref's element scrolls into view.
 * Re-checks visibility after each fetch, so a sentinel that stays visible
 * (for example after a cache hit) keeps loading.
 */
export function useLoadMoreSentinel({
  hasNext,
  isFetching,
  onLoadMore,
  rootMargin = "200px",
}: UseLoadMoreSentinelOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<HTMLElement | null>(null);

  // Refs avoid stale closures in the observer callback
  const stateRef = useRef({ hasNext, isFetching, onLoadMore });
  stateRef.current = { hasNext, isFetching, onLoadMore };

  const ref = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      nodeRef.current = node;
      if (!node) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) {
            return;
          }
          const state = stateRef.current;
          if (state.hasNext && !state.isFetching && state.onLoadMore) {
            state.onLoadMore();
          }
        },
        { rootMargin, threshold: 0 }
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [rootMargin]
  );

  // Reconnecting forces an immediate intersection check once a fetch ends
  useEffect(() => {
    const observer = observerRef.current;
    const node = nodeRef.current;
    if (isFetching || !observer || !node) {
      return;
    }
    if (observer.takeRecords().length === 0) {
      observer.disconnect();
      observer.observe(node);
    }
  }, [isFetching]);

  return ref;
}
