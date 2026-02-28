import { GallerySkeleton } from "@sparkyidea/dataview/views/gallery-view";
import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { Suspense } from "react";
import { FlatGalleryDemo } from "./components/flat-gallery-demo";
import { GroupGalleryDemo } from "./components/group-gallery-demo";
import { HybridGalleryDemo } from "./components/hybrid-gallery-demo";

interface GalleryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<GallerySkeleton cardCount={6} />}>
      <Tabs defaultValue="flat">
        <TabsContent value="flat">
          <FlatGalleryDemo params={params} />
        </TabsContent>
        <TabsContent value="group">
          <GroupGalleryDemo params={params} />
        </TabsContent>
        <TabsContent value="hybrid">
          <HybridGalleryDemo params={params} />
        </TabsContent>
      </Tabs>
    </Suspense>
  );
}
