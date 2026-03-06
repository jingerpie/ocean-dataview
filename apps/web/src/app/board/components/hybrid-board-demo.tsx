import { productGroupPaginationParams } from "@/lib/validations";
import { ProductBoardView } from "@/modules/dataview/product-board-view";

interface ProductBoardDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function ProductBoardDemo({ params }: ProductBoardDemoProps) {
  const { column, filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <ProductBoardView
      column={column}
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
