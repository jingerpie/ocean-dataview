import { productGroupPaginationParams } from "@/lib/validations";
import { FlatTable } from "@/modules/table/flat-table";

interface FlatTableDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function FlatTableDemo({ params }: FlatTableDemoProps) {
  const { filter, sort, search, limit } =
    productGroupPaginationParams.parse(params);

  return (
    <FlatTable filter={filter} limit={limit} search={search} sort={sort} />
  );
}
