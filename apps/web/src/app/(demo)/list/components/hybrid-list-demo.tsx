import {
  productPaginationParams,
  validateProductFilter,
  validateProductSort,
} from "@/lib/validations";
import { ProductListView } from "@/modules/dataview/product-list-view";

interface ProductListDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function ProductListDemo({ params }: ProductListDemoProps) {
  const { filter, group, limit, search, sort } =
    productPaginationParams.parse(params);

  // Validate against product properties
  const validatedFilter = validateProductFilter(filter);
  const validatedSort = validateProductSort(sort);

  return (
    <ProductListView
      filter={validatedFilter}
      group={group}
      limit={limit}
      search={search ?? ""}
      sort={validatedSort ?? []}
    />
  );
}
