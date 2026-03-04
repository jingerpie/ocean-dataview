import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { FlatBoardDemo } from "./components/flat-board-demo";
import { GroupBoardDemo } from "./components/group-board-demo";
import { HybridBoardDemo } from "./components/hybrid-board-demo";

interface BoardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const params = await searchParams;

  // No outer Suspense needed - each demo component has its own Suspense boundary
  // that properly wraps only the data-fetching portion (DataViewProvider)
  return (
    <Tabs defaultValue="flat">
      <TabsContent value="flat">
        <FlatBoardDemo params={params} />
      </TabsContent>
      <TabsContent value="group">
        <GroupBoardDemo params={params} />
      </TabsContent>
      <TabsContent value="hybrid">
        <HybridBoardDemo params={params} />
      </TabsContent>
    </Tabs>
  );
}
