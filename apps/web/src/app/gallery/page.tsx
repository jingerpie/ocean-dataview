import { ProductGalleryDemo } from "./components/hybrid-gallery-demo";

interface GalleryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;

  return <ProductGalleryDemo params={params} />;
}
