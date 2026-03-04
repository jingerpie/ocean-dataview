import { productGroupPaginationParams } from "@/lib/validations";
import { GroupGallery } from "@/modules/gallery/group-gallery";

interface GroupGalleryDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function GroupGalleryDemo({ params }: GroupGalleryDemoProps) {
  const { filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <GroupGallery
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
