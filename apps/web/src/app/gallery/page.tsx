import { Tabs, TabsContent } from "@sparkyidea/ui/components/tabs";
import { FlatGalleryDemo } from "./components/flat-gallery-demo";
import { GroupGalleryDemo } from "./components/group-gallery-demo";
import { HybridGalleryDemo } from "./components/hybrid-gallery-demo";

interface GalleryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;

  // No outer Suspense needed - each demo component has its own Suspense boundary
  // that properly wraps only the data-fetching portion (DataViewProvider)
  return (
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
  );
}
