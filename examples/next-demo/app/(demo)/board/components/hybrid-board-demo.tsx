import { ProductBoardView } from "@/modules/dataview/product-board-view";
import {
  productPaginationParams,
  validateProductColumn,
  validateProductFilter,
  validateProductSort,
} from "@/modules/dataview/validations";

interface ProductBoardDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function ProductBoardDemo({ params }: ProductBoardDemoProps) {
  const { column, filter, group, limit, search, sort } =
    productPaginationParams.parse(params);

  // Validate against product properties
  const validatedColumn = validateProductColumn(column);
  const validatedFilter = validateProductFilter(filter);
  const validatedSort = validateProductSort(sort);

  return (
    <ProductBoardView
      column={validatedColumn}
      filter={validatedFilter}
      group={group}
      limit={limit}
      search={search ?? ""}
      sort={validatedSort ?? []}
    />
  );
}
