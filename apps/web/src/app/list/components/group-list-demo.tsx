import { productGroupPaginationParams } from "@/lib/validations";
import { GroupList } from "@/modules/list/group-list";

interface GroupListDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function GroupListDemo({ params }: GroupListDemoProps) {
  const { expanded, filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <GroupList
      expanded={expanded}
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
