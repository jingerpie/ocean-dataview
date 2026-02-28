import { productGroupPaginationParams } from "@/lib/validations";
import { HybridTable } from "@/modules/table/hybrid-table";

interface HybridTableDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function HybridTableDemo({ params }: HybridTableDemoProps) {
  const { expanded, filter, group, limit, search, sort, subGroup } =
    productGroupPaginationParams.parse(params);

  return (
    <HybridTable
      expanded={expanded}
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
      subGroup={subGroup}
    />
  );
}
