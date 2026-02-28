import { productGroupPaginationParams } from "@/lib/validations";
import { HybridBoard } from "@/modules/board/hybrid-board";

interface HybridBoardDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function HybridBoardDemo({ params }: HybridBoardDemoProps) {
  const { filter, sort, search, limit, expanded, group, subGroup } =
    productGroupPaginationParams.parse(params);

  return (
    <HybridBoard
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
