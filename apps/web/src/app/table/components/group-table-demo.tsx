import { productGroupPaginationParams } from "@/lib/validations";
import { GroupTable } from "@/modules/table/group-table";

interface GroupTableDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function GroupTableDemo({ params }: GroupTableDemoProps) {
  const { filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <GroupTable
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
