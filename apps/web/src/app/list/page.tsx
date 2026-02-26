"use client";

import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { Suspense } from "react";
import { FlatList } from "@/modules/list/flat-list";
import { GroupList } from "@/modules/list/group-list";
import { HybridList } from "@/modules/list/hybrid-list";

export default function ListPage() {
  return (
    <Suspense>
      <Tabs defaultValue="flat">
        <TabsContent value="flat">
          <FlatList />
        </TabsContent>
        <TabsContent value="group">
          <GroupList />
        </TabsContent>
        <TabsContent value="hybrid">
          <HybridList />
        </TabsContent>
      </Tabs>
    </Suspense>
  );
}
