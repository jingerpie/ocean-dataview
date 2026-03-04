import { productGroupPaginationParams } from "@/lib/validations";
import { GroupList } from "@/modules/list/group-list";

interface GroupListDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function GroupListDemo({ params }: GroupListDemoProps) {
  const { filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <GroupList
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
