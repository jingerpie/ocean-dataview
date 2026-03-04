"use client";

import type { Limit } from "@sparkyidea/shared/types/pagination.type";
import type { GroupConfigInput } from "@sparkyidea/shared/utils/parsers/group";
import { useCallback, useMemo, useRef } from "react";
import type {
  BaseQueryOptions,
  PagePaginationController,
  PageQueryOptionsFactory,
} from "../types/pagination-controller";

export interface PageGroupInfo<TData> {
  count?: number;
  displayCount?: string;
  displayEnd: number;
  displayStart: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFetching: boolean;
  items: TData[];
  key: string;
  onNext: () => void;
  onPrev: () => void;
}

export interface PagePaginationState<TData> {
  groups: PageGroupInfo<TData>[];
  limit: Limit;
  onLimitChange: (limit: Limit) => void;
}

export type {
  GroupQueryOptionsFactory,
  PageQueryOptionsFactory,
  PageQueryOptionsFactoryParams,
} from "../types/pagination-controller";

export interface UsePagePaginationOptions<
  TQueryOptions extends BaseQueryOptions = BaseQueryOptions,
> {
  groupQueryOptionsFactory?: (
    groupConfig: GroupConfigInput
  ) => BaseQueryOptions;
  queryOptionsFactory: PageQueryOptionsFactory<TQueryOptions>;
}

export interface UsePagePaginationResult<TQueryOptions> {
  pagination: PagePaginationController<TQueryOptions>;
}

export function usePagePagination<
  TQueryOptions extends BaseQueryOptions = BaseQueryOptions,
>(
  options: UsePagePaginationOptions<TQueryOptions>
): UsePagePaginationResult<TQueryOptions> {
  const { groupQueryOptionsFactory, queryOptionsFactory } = options;

  const factoryRef = useRef(queryOptionsFactory);
  factoryRef.current = queryOptionsFactory;
  const stableFactory = useCallback<PageQueryOptionsFactory<TQueryOptions>>(
    (params) => factoryRef.current(params),
    []
  );

  const groupFactoryRef = useRef(groupQueryOptionsFactory);
  groupFactoryRef.current = groupQueryOptionsFactory;
  const stableGroupFactory = useMemo<
    ((groupConfig: GroupConfigInput) => BaseQueryOptions) | undefined
  >(() => {
    if (!groupQueryOptionsFactory) {
      return undefined;
    }
    return (groupConfig) => {
      const factory = groupFactoryRef.current;
      if (!factory) {
        throw new Error("groupQueryOptionsFactory ref is unexpectedly null");
      }
      return factory(groupConfig);
    };
  }, [Boolean(groupQueryOptionsFactory)]);

  const pagination = useMemo<PagePaginationController<TQueryOptions>>(
    () => ({
      groupQueryOptionsFactory: stableGroupFactory,
      queryOptionsFactory: stableFactory,
      type: "page",
    }),
    [stableGroupFactory, stableFactory]
  );

  return { pagination };
}
