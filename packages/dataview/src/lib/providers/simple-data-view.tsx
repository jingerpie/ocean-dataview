"use client";

import { type ReactNode, useCallback, useMemo } from "react";
import type { GroupConfigInput } from "../../types/group.type";
import type { PageController } from "../../types/pagination-controller";
import type { BidirectionalPaginatedResponse } from "../../types/pagination-types";
import type { DataViewProperty } from "../../types/property.type";
import { DataViewProvider, type DefaultsConfig } from "./data-view-provider";

/**
 * Shorthand group config that omits `propertyType`; the provider infers it
 * from the `properties` array. Full `GroupConfigInput` objects are still
 * accepted (the shorthand is additive).
 */
type SimpleGroupShorthand = Omit<GroupConfigInput, "propertyType"> & {
  propertyType?: never;
};

export type SimpleGroupConfig = GroupConfigInput | SimpleGroupShorthand;

const NULL_GROUP_KEY = "__null__";

const EXACT_GROUPABLE_TYPES = new Set(["text", "select", "status", "checkbox"]);

const FAN_OUT_GROUPABLE_TYPES = new Set(["multiSelect"]);

/** Minimal shape read from DataViewProperty during grouping. */
interface GroupAccessor {
  id: string;
  key: string;
  type: string;
}

interface StaticDataQueryParams {
  cursor?: { after?: string; before?: string; start?: number } | null;
  filter?: unknown;
  groupBy?: {
    key: string;
    type: GroupConfigInput;
  } | null;
  limit?: number;
  search?: unknown;
  sort?: unknown;
}

interface SynthesizedGroupPage {
  counts: Record<string, { count: number; hasMore: boolean }>;
  hasNextPage: false;
  nextCursor: null;
  sortValues: Record<string, string | number>;
}

export interface SimpleDataViewProviderProps<
  TData,
  TProperties extends readonly DataViewProperty<TData>[],
> {
  children: ReactNode;
  className?: string;
  /** Static data array to display */
  data: TData[];
  /** URL defaults. Accepts a shorthand `group` that infers propertyType from properties. */
  defaults?: Omit<DefaultsConfig, "group" | "limit"> & {
    group?: SimpleGroupConfig;
  };
  properties: TProperties;
  propertyVisibility?: TProperties[number]["id"][];
}

export function SimpleDataViewProvider<
  TData,
  TProperties extends
    readonly DataViewProperty<TData>[] = readonly DataViewProperty<TData>[],
>({
  children,
  className,
  data,
  defaults,
  properties,
  propertyVisibility,
}: SimpleDataViewProviderProps<TData, TProperties>) {
  // --------------------------------------------------------------------------
  // Resolve group config (shorthand → full GroupConfigInput)
  // --------------------------------------------------------------------------

  const resolvedGroup = useMemo<GroupConfigInput | undefined>(() => {
    const group = defaults?.group;
    if (!group) {
      return;
    }
    const property = properties.find((p) => p.id === group.propertyId);
    if (!property) {
      throw new Error(
        `SimpleDataViewProvider: unknown group propertyId '${group.propertyId}'`
      );
    }
    const propertyType = group.propertyType ?? property.type;
    if (
      !(
        EXACT_GROUPABLE_TYPES.has(propertyType) ||
        FAN_OUT_GROUPABLE_TYPES.has(propertyType)
      )
    ) {
      throw new Error(
        `SimpleDataViewProvider: property '${property.id}' of type '${propertyType}' is not supported for in-memory grouping. Use usePageController with a real groupQuery for date/number grouping.`
      );
    }
    return { ...group, propertyType } as GroupConfigInput;
  }, [defaults?.group, properties]);

  const groupAccessor = useMemo<GroupAccessor | null>(() => {
    if (!resolvedGroup) {
      return null;
    }
    const property = properties.find((p) => p.id === resolvedGroup.propertyId);
    if (!property) {
      return null;
    }
    return {
      id: property.id,
      key: property.key ?? property.id,
      type: resolvedGroup.propertyType,
    };
  }, [resolvedGroup, properties]);

  // --------------------------------------------------------------------------
  // Bucketing
  // --------------------------------------------------------------------------

  const bucketKeysForRow = useCallback(
    (row: TData, accessor: GroupAccessor): string[] => {
      const value = (row as Record<string, unknown>)[accessor.key];
      if (value === null || value === undefined) {
        return [NULL_GROUP_KEY];
      }
      if (FAN_OUT_GROUPABLE_TYPES.has(accessor.type)) {
        if (!Array.isArray(value)) {
          return [NULL_GROUP_KEY];
        }
        if (value.length === 0) {
          return [NULL_GROUP_KEY];
        }
        return value.map((v) => String(v));
      }
      return [String(value)];
    },
    []
  );

  // --------------------------------------------------------------------------
  // Synthesized group keys + counts from static data
  // --------------------------------------------------------------------------

  const groupSummary = useMemo(() => {
    if (!groupAccessor) {
      return null;
    }
    const counts: Record<string, { count: number; hasMore: boolean }> = {};
    const sortValues: Record<string, string | number> = {};
    for (const row of data) {
      const keys = bucketKeysForRow(row, groupAccessor);
      for (const key of keys) {
        if (counts[key]) {
          counts[key].count += 1;
        } else {
          counts[key] = { count: 1, hasMore: false };
          sortValues[key] = key;
        }
      }
    }

    const hideEmpty = resolvedGroup?.hideEmpty ?? false;
    let keys = Object.keys(counts);
    if (hideEmpty) {
      keys = keys.filter((k) => (counts[k]?.count ?? 0) > 0);
    }
    const direction = resolvedGroup?.sort === "desc" ? -1 : 1;
    keys.sort((a, b) => a.localeCompare(b) * direction);

    return { counts, keys, sortValues };
  }, [data, groupAccessor, bucketKeysForRow, resolvedGroup]);

  // --------------------------------------------------------------------------
  // dataQuery: partitions static data by groupBy.key when grouped
  // --------------------------------------------------------------------------

  const dataQuery = useCallback(
    (params: StaticDataQueryParams) => {
      const groupBy = params.groupBy ?? null;
      const isGroupedCall = Boolean(groupBy && groupAccessor);

      const items: TData[] = isGroupedCall
        ? data.filter((row) => {
            if (!(groupAccessor && groupBy)) {
              return true;
            }
            return bucketKeysForRow(row, groupAccessor).includes(groupBy.key);
          })
        : data;

      const response: BidirectionalPaginatedResponse<TData> = {
        items,
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
        startCursor: null,
      };

      return {
        queryKey: [
          "simple-dataview",
          data,
          groupAccessor?.key ?? null,
          groupBy?.key ?? null,
          params.limit ?? null,
        ] as const,
        queryFn: () => Promise.resolve(response),
        // Only hydrate initial data for the flat path; grouped callers must
        // wait for their filtered result to avoid leaking full data into the
        // first render of a group.
        ...(isGroupedCall ? {} : { initialData: response }),
      };
    },
    [data, groupAccessor, bucketKeysForRow]
  );

  // --------------------------------------------------------------------------
  // groupQuery: returns synthesized group keys + counts as an infinite page
  // --------------------------------------------------------------------------

  const groupQuery = useMemo(() => {
    if (!(resolvedGroup && groupSummary)) {
      return;
    }
    return () => {
      const page: SynthesizedGroupPage = {
        counts: groupSummary.counts,
        hasNextPage: false,
        nextCursor: null,
        sortValues: groupSummary.sortValues,
      };
      return {
        queryKey: [
          "simple-dataview-groups",
          data,
          resolvedGroup.propertyId,
          resolvedGroup.propertyType,
          resolvedGroup.sort ?? "asc",
          resolvedGroup.hideEmpty ?? false,
        ] as const,
        queryFn: () => Promise.resolve(page),
        initialPageParam: null,
        getNextPageParam: () => null,
      };
    };
  }, [resolvedGroup, groupSummary, data]);

  // --------------------------------------------------------------------------
  // Controller
  // --------------------------------------------------------------------------

  // Construct the controller directly instead of going through usePageController.
  // usePageController stabilizes dataQuery via a ref so inline factories don't
  // churn the controller identity — but that hides downstream data changes from
  // the query bridge, since dataQuery here closes over `data` and consumers
  // memoize queryOptions on the dataQuery reference. Building the controller
  // with the real (already-memoized) factories lets data updates propagate.
  const controller = useMemo<PageController<unknown>>(
    () => ({
      dataQuery: dataQuery as PageController<unknown>["dataQuery"],
      groupQuery: groupQuery as PageController<unknown>["groupQuery"],
      type: "page",
    }),
    [dataQuery, groupQuery]
  );

  // --------------------------------------------------------------------------
  // Defaults passthrough
  // --------------------------------------------------------------------------

  const mergedDefaults: DefaultsConfig = useMemo(() => {
    const { group: _shorthandGroup, expanded, ...rest } = defaults ?? {};
    const defaultExpanded =
      expanded ?? (resolvedGroup ? groupSummary?.keys : undefined);
    return {
      ...rest,
      ...(resolvedGroup ? { group: resolvedGroup } : {}),
      ...(defaultExpanded ? { expanded: defaultExpanded } : {}),
      limit: 100,
    };
  }, [defaults, resolvedGroup, groupSummary]);

  return (
    <DataViewProvider
      className={className}
      controller={controller}
      defaults={mergedDefaults}
      properties={properties}
      propertyVisibility={propertyVisibility}
    >
      {children}
    </DataViewProvider>
  );
}
