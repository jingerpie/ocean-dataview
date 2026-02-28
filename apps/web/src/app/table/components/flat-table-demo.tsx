import type { SortQuery, WhereNode } from "@sparkyidea/shared/types";
import { productGroupPaginationParams } from "@/lib/validations";
import { FlatTable } from "@/modules/table/flat-table";

interface FlatTableDemoProps {
  params: Record<string, string | string[] | undefined>;
}

const defaultFilter = [
  {
    property: "category",
    condition: "inArray",
    value: ["Accessories"],
  },
] satisfies WhereNode[];

const defaultSort = [
  { property: "productName", direction: "asc" },
] satisfies SortQuery[];

export function FlatTableDemo({ params }: FlatTableDemoProps) {
  const { filter, sort, search, limit } =
    productGroupPaginationParams.parse(params);

  return (
    <FlatTable
      filter={filter ?? defaultFilter}
      limit={limit}
      search={search}
      sort={sort.length > 0 ? sort : defaultSort}
    />
  );
}
