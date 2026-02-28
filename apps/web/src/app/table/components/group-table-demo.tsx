import { productGroupPaginationParams } from "@/lib/validations";
import { GroupTable } from "@/modules/table/group-table";

interface GroupTableDemoProps {
  params: Record<string, string | string[] | undefined>;
}

export function GroupTableDemo({ params }: GroupTableDemoProps) {
  const { expanded, filter, group, limit, search, sort } =
    productGroupPaginationParams.parse(params);

  return (
    <GroupTable
      expanded={expanded}
      filter={filter}
      group={group}
      limit={limit}
      search={search}
      sort={sort}
    />
  );
}
