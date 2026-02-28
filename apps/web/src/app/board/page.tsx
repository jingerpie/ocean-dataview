import { BoardSkeleton } from "@sparkyidea/dataview/views/board-view";
import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { Suspense } from "react";
import { FlatBoardDemo } from "./components/flat-board-demo";
import { GroupBoardDemo } from "./components/group-board-demo";
import { HybridBoardDemo } from "./components/hybrid-board-demo";

interface BoardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<BoardSkeleton columnCount={4} />}>
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
    </Suspense>
  );
}
