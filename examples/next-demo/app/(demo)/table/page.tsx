import { connection } from "next/server";
import { ProductTableView } from "@/modules/dataview/product-table-view";

export default async function TablePage() {
  // Render per request so the view reads its URL state on the server
  await connection();

  return <ProductTableView />;
}
