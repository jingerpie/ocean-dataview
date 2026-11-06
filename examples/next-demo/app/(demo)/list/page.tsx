import { connection } from "next/server";
import { ProductListView } from "@/modules/dataview/product-list-view";

export default async function ListPage() {
  // Render per request so the view reads its URL state on the server
  await connection();

  return <ProductListView />;
}
