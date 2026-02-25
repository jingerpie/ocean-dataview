"use client";

import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { Suspense } from "react";
import { FlatTable } from "@/modules/table/flat-table";
import { GroupTable } from "@/modules/table/group-table";
import { HybridTable } from "@/modules/table/hybrid-table";

export default function TablePage() {
  return (
    <Suspense>
      <Tabs defaultValue="flat">
        <TabsContent value="flat">
          <FlatTable />
        </TabsContent>
        <TabsContent value="group">
          <GroupTable />
        </TabsContent>
        <TabsContent value="hybrid">
          <HybridTable />
        </TabsContent>
      </Tabs>
    </Suspense>
  );
}
