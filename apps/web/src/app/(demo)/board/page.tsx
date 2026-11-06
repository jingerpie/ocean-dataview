import { connection } from "next/server";
import { ProductBoardView } from "@/modules/dataview/product-board-view";

export default async function BoardPage() {
  // Render per request so the view reads its URL state on the server
  await connection();

  return <ProductBoardView />;
}
