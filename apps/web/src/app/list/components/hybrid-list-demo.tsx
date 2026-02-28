import { productGroupPaginationParams } from "@/lib/validations";
import { HybridList } from "@/modules/list/hybrid-list";

interface HybridListDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function HybridListDemo({ params }: HybridListDemoProps) {
  const { expanded, filter, group, limit, search, sort, subGroup } =
    productGroupPaginationParams.parse(params);

  return (
    <HybridList
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
