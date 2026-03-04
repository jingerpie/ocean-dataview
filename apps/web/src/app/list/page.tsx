import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { FlatListDemo } from "./components/flat-list-demo";
import { GroupListDemo } from "./components/group-list-demo";
import { HybridListDemo } from "./components/hybrid-list-demo";

interface ListPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListPage({ searchParams }: ListPageProps) {
  const params = await searchParams;

  // No outer Suspense needed - each demo component has its own Suspense boundary
  // that properly wraps only the data-fetching portion (DataViewProvider)
  return (
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
  );
}
