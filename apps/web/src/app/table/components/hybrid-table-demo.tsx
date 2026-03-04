import { productGroupPaginationParams } from "@/lib/validations";
import { HybridTable } from "@/modules/table/hybrid-table";

interface HybridTableDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function HybridTableDemo({ params }: HybridTableDemoProps) {
  const { filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <HybridTable
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
