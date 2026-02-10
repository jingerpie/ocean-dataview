/**
 * @see https://github.com/mantinedev/mantine/blob/master/packages/@mantine/hooks/src/use-debounced-callback/use-debounced-callback.ts
 */

import { useCallback, useEffect, useRef } from "react";

import { useCallbackRef } from "./use-callback-ref";

export interface DebouncedFunction<T extends (...args: never[]) => unknown> {
  (...args: Parameters<T>): void;
  flush: () => void;
  cancel: () => void;
  isPending: () => boolean;
}

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): DebouncedFunction<T> {
  const handleCallback = useCallbackRef(callback);
  const debounceTimerRef = useRef(0);
  const pendingArgsRef = useRef<Parameters<T>>();

  useEffect(() => () => window.clearTimeout(debounceTimerRef.current), []);

  const cancel = useCallback(() => {
    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = 0;
    pendingArgsRef.current = undefined;
  }, []);

  const flush = useCallback(() => {
    if (debounceTimerRef.current && pendingArgsRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = 0;
      const args = pendingArgsRef.current;
      pendingArgsRef.current = undefined;
      handleCallback(...args);
    }
  }, [handleCallback]);

  const isPending = useCallback(() => debounceTimerRef.current !== 0, []);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      window.clearTimeout(debounceTimerRef.current);
      pendingArgsRef.current = args;
      debounceTimerRef.current = window.setTimeout(
        () => handleCallback(...args),
        delay
      );
    },
    [handleCallback, delay]
  ) as DebouncedFunction<T>;

  debouncedFn.flush = flush;
  debouncedFn.cancel = cancel;
  debouncedFn.isPending = isPending;

  return debouncedFn;
}
