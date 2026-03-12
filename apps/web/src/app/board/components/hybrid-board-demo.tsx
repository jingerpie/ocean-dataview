import {
  productPaginationParams,
  validateProductFilter,
  validateProductSort,
} from "@/lib/validations";
import { ProductBoardView } from "@/modules/dataview/product-board-view";

interface ProductBoardDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function ProductBoardDemo({ params }: ProductBoardDemoProps) {
  const { column, filter, group, limit, search, sort } =
    productPaginationParams.parse(params);

  // Validate against product properties
  const validatedFilter = validateProductFilter(filter);
  const validatedSort = validateProductSort(sort);

  return (
    <ProductBoardView
      column={column}
      filter={validatedFilter}
      group={group}
      limit={limit}
      search={search ?? ""}
      sort={validatedSort ?? []}
    />
  );
}
