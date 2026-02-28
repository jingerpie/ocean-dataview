import { productGroupPaginationParams } from "@/lib/validations";
import { FlatList } from "@/modules/list/flat-list";

interface FlatListDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function FlatListDemo({ params }: FlatListDemoProps) {
  const { filter, sort, search, limit } =
    productGroupPaginationParams.parse(params);

  return <FlatList filter={filter} limit={limit} search={search} sort={sort} />;
}
