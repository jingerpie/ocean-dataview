import {
  productPaginationParams,
  validateProductFilter,
  validateProductSort,
} from "@/lib/validations";
import { ProductTableView } from "@/modules/dataview/product-table-view";

interface ProductTableDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function ProductTableDemo({ params }: ProductTableDemoProps) {
  const { filter, group, limit, search, sort } =
    productPaginationParams.parse(params);

  // Validate against product properties
  const validatedFilter = validateProductFilter(filter);
  const validatedSort = validateProductSort(sort);

  return (
    <ProductTableView
      filter={validatedFilter}
      group={group}
      limit={limit}
      search={search ?? ""}
      sort={validatedSort ?? []}
    />
  );
}
