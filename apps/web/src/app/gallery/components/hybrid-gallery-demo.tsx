import { productGroupPaginationParams } from "@/lib/validations";
import { HybridGallery } from "@/modules/gallery/hybrid-gallery";

interface HybridGalleryDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function HybridGalleryDemo({ params }: HybridGalleryDemoProps) {
  const { filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <HybridGallery
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
