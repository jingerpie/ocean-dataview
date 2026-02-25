"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sparkyidea/ui/components/tabs";
import { Suspense } from "react";
import { FlatGallery } from "@/modules/gallery/flat-gallery";
import { GroupGallery } from "@/modules/gallery/group-gallery";

export default function GalleryPage() {
  return (
    <Suspense>
      <Tabs defaultValue="flat">
        <TabsList>
          <TabsTrigger value="flat">Flat</TabsTrigger>
          <TabsTrigger value="group">Group</TabsTrigger>
        </TabsList>
        <TabsContent value="flat">
          <FlatGallery />
        </TabsContent>
        <TabsContent value="group">
          <GroupGallery />
        </TabsContent>
      </Tabs>
    </Suspense>
  );
}
