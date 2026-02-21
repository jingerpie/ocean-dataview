/**
 * Simple debounced callback hook based on Mantine.
 * @see https://github.com/mantinedev/mantine/blob/master/packages/@mantine/hooks/src/use-debounced-callback/use-debounced-callback.ts
 *
 * Enhanced with flush-on-unmount behavior to ensure pending calls complete
 * when components unmount (e.g., popover closes before debounce timer fires).
 */

import { useCallback, useEffect, useRef } from "react";

import { useCallbackRef } from "./use-callback-ref";

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
) {
  const handleCallback = useCallbackRef(callback);
  const debounceTimerRef = useRef(0);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);

  // Flush pending call on unmount instead of cancelling
  useEffect(
    () => () => {
      window.clearTimeout(debounceTimerRef.current);
      if (pendingArgsRef.current !== null) {
        handleCallback(...pendingArgsRef.current);
        pendingArgsRef.current = null;
      }
    },
    [handleCallback]
  );

  const setValue = useCallback(
    (...args: Parameters<T>) => {
      window.clearTimeout(debounceTimerRef.current);
      pendingArgsRef.current = args;
      debounceTimerRef.current = window.setTimeout(() => {
        pendingArgsRef.current = null;
        handleCallback(...args);
      }, delay);
    },
    [handleCallback, delay]
  );

  return setValue;
}
