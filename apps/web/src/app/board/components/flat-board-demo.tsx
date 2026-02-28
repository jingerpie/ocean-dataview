import { productGroupPaginationParams } from "@/lib/validations";
import { FlatBoard } from "@/modules/board/flat-board";

interface FlatBoardDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function FlatBoardDemo({ params }: FlatBoardDemoProps) {
  const { filter, sort, search, limit } =
    productGroupPaginationParams.parse(params);

  return (
    <FlatBoard filter={filter} limit={limit} search={search} sort={sort} />
  );
}
