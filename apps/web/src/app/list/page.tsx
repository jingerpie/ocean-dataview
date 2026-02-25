"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sparkyidea/ui/components/tabs";
import { Suspense } from "react";
import { FlatList } from "@/modules/list/flat-list";
import { GroupList } from "@/modules/list/group-list";

export default function ListPage() {
  return (
    <Suspense>
      <Tabs defaultValue="flat">
        <TabsList>
          <TabsTrigger value="flat">Flat</TabsTrigger>
          <TabsTrigger value="group">Group</TabsTrigger>
        </TabsList>
        <TabsContent value="flat">
          <FlatList />
        </TabsContent>
        <TabsContent value="group">
          <GroupList />
        </TabsContent>
      </Tabs>
    </Suspense>
  );
}
