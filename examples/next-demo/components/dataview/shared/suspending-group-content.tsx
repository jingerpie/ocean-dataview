"use client";

import {
  type UseGroupQueryResult,
  type UseInfiniteGroupQueryResult,
  useGroupQuery,
  useInfiniteGroupQuery,
} from "@jingerpie/dataview-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/dataview/views/empty-state";

// ============================================================================
// Page Pagination (useGroupQuery)
// ============================================================================

interface SuspendingGroupContentProps<TData> {
  /** Render function receiving query result */
  children: (result: UseGroupQueryResult<TData>) => ReactNode;
  /** The group key to query for */
  groupKey: string;
}

/**
 * SuspendingGroupContent - Fetches group data and suspends until ready.
 *
 * Uses useGroupQuery (which calls useSuspenseQuery internally) to fetch data
 * for a specific group. The component suspends during fetch, allowing React
 * Suspense to show a fallback.
 *
 * When data is ready, passes the full query result to the children render prop.
 */
export function SuspendingGroupContent<TData>({
  children,
  groupKey,
}: SuspendingGroupContentProps<TData>) {
  const result = useGroupQuery<TData>({ groupKey });

  if (result.data.length === 0) {
    return <EmptyState />;
  }

  return children(result);
}

// ============================================================================
// Infinite Pagination (useInfiniteGroupQuery)
// ============================================================================

interface SuspendingInfiniteGroupContentProps<TData> {
  /** Render function receiving query result */
  children: (result: UseInfiniteGroupQueryResult<TData>) => ReactNode;
  /** The group key to query for */
  groupKey: string;
}

/**
 * SuspendingInfiniteGroupContent - Fetches infinite group data and suspends until ready.
 *
 * Uses useInfiniteGroupQuery (which calls useSuspenseInfiniteQuery internally) to fetch
 * data for a specific group with infinite pagination. The component suspends during
 * initial fetch, allowing React Suspense to show a fallback.
 *
 * When data is ready, passes the full query result to the children render prop.
 */
export function SuspendingInfiniteGroupContent<TData>({
  children,
  groupKey,
}: SuspendingInfiniteGroupContentProps<TData>) {
  const result = useInfiniteGroupQuery<TData>({ groupKey });

  if (result.data.length === 0) {
    return <EmptyState />;
  }

  return children(result);
}
