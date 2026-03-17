import {
  productPaginationParams,
  validateProductFilter,
  validateProductSort,
} from "@/lib/validations";
import { ProductGalleryView } from "@/modules/dataview/product-gallery-view";

interface ProductGalleryDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function ProductGalleryDemo({ params }: ProductGalleryDemoProps) {
  const { filter, group, limit, search, sort } =
    productPaginationParams.parse(params);

  // Validate against product properties
  const validatedFilter = validateProductFilter(filter);
  const validatedSort = validateProductSort(sort);

  return (
    <ProductGalleryView
      filter={validatedFilter}
      group={group}
      limit={limit}
      search={search ?? ""}
      sort={validatedSort ?? []}
    />
  );
}
