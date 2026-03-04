import { productGroupPaginationParams } from "@/lib/validations";
import { GroupBoard } from "@/modules/board/group-board";

interface GroupBoardDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function GroupBoardDemo({ params }: GroupBoardDemoProps) {
  const { filter, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <GroupBoard filter={filter} limit={limit} search={search} sort={sort} />
  );
}
