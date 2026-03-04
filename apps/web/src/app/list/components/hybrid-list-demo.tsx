import { productGroupPaginationParams } from "@/lib/validations";
import { HybridList } from "@/modules/list/hybrid-list";

interface HybridListDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function HybridListDemo({ params }: HybridListDemoProps) {
  const { filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <HybridList
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
