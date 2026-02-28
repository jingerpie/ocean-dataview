import { productGroupPaginationParams } from "@/lib/validations";
import { FlatGallery } from "@/modules/gallery/flat-gallery";

interface FlatGalleryDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function FlatGalleryDemo({ params }: FlatGalleryDemoProps) {
  const { filter, sort, search, limit } =
    productGroupPaginationParams.parse(params);

  return (
    <FlatGallery filter={filter} limit={limit} search={search} sort={sort} />
  );
}
