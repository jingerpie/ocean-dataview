import { productGroupPaginationParams } from "@/lib/validations";
import { ProductListView } from "@/modules/dataview/product-list-view";

interface ProductListDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function ProductListDemo({ params }: ProductListDemoProps) {
  const { filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <ProductListView
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
