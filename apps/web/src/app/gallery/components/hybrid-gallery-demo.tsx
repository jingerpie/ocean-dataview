import { productGroupPaginationParams } from "@/lib/validations";
import { HybridGallery } from "@/modules/gallery/hybrid-gallery";

interface HybridGalleryDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function HybridGalleryDemo({ params }: HybridGalleryDemoProps) {
  const { expanded, filter, group, limit, search, sort, subGroup } =
    productGroupPaginationParams.parse(params);

  return (
    <HybridGallery
      expanded={expanded}
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
      subGroup={subGroup}
    />
  );
}
