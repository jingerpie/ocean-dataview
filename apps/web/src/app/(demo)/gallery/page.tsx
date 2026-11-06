import { connection } from "next/server";
import { ProductGalleryView } from "@/modules/dataview/product-gallery-view";

export default async function GalleryPage() {
  // Render per request so the view reads its URL state on the server
  await connection();

  return <ProductGalleryView />;
}
