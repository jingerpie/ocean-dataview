import { TableSkeleton } from "@sparkyidea/dataview/views/table-view";
import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { Suspense } from "react";
import { FlatTableDemo } from "./components/flat-table-demo";
import { GroupTableDemo } from "./components/group-table-demo";
import { HybridTableDemo } from "./components/hybrid-table-demo";

interface TablePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TablePage({ searchParams }: TablePageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<TableSkeleton columnCount={5} rowCount={10} />}>
      <Tabs defaultValue="flat">
        <TabsContent value="flat">
          <FlatTableDemo params={params} />
        </TabsContent>
        <TabsContent value="group">
          <GroupTableDemo params={params} />
        </TabsContent>
        <TabsContent value="hybrid">
          <HybridTableDemo params={params} />
        </TabsContent>
      </Tabs>
    </Suspense>
  );
}
