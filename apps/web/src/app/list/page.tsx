import { ListSkeleton } from "@sparkyidea/dataview/views/list-view";
import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { Suspense } from "react";
import { FlatListDemo } from "./components/flat-list-demo";
import { GroupListDemo } from "./components/group-list-demo";
import { HybridListDemo } from "./components/hybrid-list-demo";

interface ListPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListPage({ searchParams }: ListPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<ListSkeleton rowCount={10} />}>
      <Tabs defaultValue="flat">
        <TabsContent value="flat">
          <FlatListDemo params={params} />
        </TabsContent>
        <TabsContent value="group">
          <GroupListDemo params={params} />
        </TabsContent>
        <TabsContent value="hybrid">
          <HybridListDemo params={params} />
        </TabsContent>
      </Tabs>
    </Suspense>
  );
}
