"use client";

import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { Suspense } from "react";
import { FlatBoard } from "@/modules/board/flat-board";
import { GroupBoard } from "@/modules/board/group-board";
import { HybridBoard } from "@/modules/board/hybrid-board";

export default function BoardPage() {
  return (
    <Suspense>
      <Tabs defaultValue="flat">
        <TabsContent value="flat">
          <FlatBoard />
        </TabsContent>
        <TabsContent value="group">
          <GroupBoard />
        </TabsContent>
        <TabsContent value="hybrid">
          <HybridBoard />
        </TabsContent>
      </Tabs>
    </Suspense>
  );
}
