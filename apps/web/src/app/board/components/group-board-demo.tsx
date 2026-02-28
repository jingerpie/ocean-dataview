import { productGroupPaginationParams } from "@/lib/validations";
import { GroupBoard } from "@/modules/board/group-board";

interface GroupBoardDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function GroupBoardDemo({ params }: GroupBoardDemoProps) {
  const { expanded, filter, group, limit, search, sort, subGroup } =
    productGroupPaginationParams.parse(params);

  return (
    <GroupBoard
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
