import { productGroupPaginationParams } from "@/lib/validations";
import { ProductTableView } from "@/modules/dataview/product-table-view";

interface ProductTableDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function ProductTableDemo({ params }: ProductTableDemoProps) {
  const { filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <ProductTableView
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
