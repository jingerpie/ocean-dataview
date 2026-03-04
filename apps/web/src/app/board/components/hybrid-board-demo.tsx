import { productGroupPaginationParams } from "@/lib/validations";
import { HybridBoard } from "@/modules/board/hybrid-board";

interface HybridBoardDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function HybridBoardDemo({ params }: HybridBoardDemoProps) {
  const { column, filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <HybridBoard
      column={column}
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
