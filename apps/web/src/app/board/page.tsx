"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sparkyidea/ui/components/tabs";
import { Suspense } from "react";
import { FlatBoard } from "@/modules/board/flat-board";
import { GroupBoard } from "@/modules/board/group-board";

export default function BoardPage() {
  return (
    <Suspense>
      <Tabs defaultValue="flat">
        <TabsList>
          <TabsTrigger value="flat">Flat</TabsTrigger>
          <TabsTrigger value="group">Group</TabsTrigger>
        </TabsList>
        <TabsContent value="flat">
          <FlatBoard />
        </TabsContent>
        <TabsContent value="group">
          <GroupBoard />
        </TabsContent>
      </Tabs>
    </Suspense>
  );
}
