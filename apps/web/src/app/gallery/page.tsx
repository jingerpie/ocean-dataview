"use client";

import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { Suspense } from "react";
import { FlatGallery } from "@/modules/gallery/flat-gallery";
import { GroupGallery } from "@/modules/gallery/group-gallery";
import { HybridGallery } from "@/modules/gallery/hybrid-gallery";

export default function GalleryPage() {
  return (
    <Suspense>
      <Tabs defaultValue="flat">
        <TabsContent value="flat">
          <FlatGallery />
        </TabsContent>
        <TabsContent value="group">
          <GroupGallery />
        </TabsContent>
        <TabsContent value="hybrid">
          <HybridGallery />
        </TabsContent>
      </Tabs>
    </Suspense>
  );
}
