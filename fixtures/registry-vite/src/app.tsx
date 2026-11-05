import type { DataViewProperty } from "@sparkyidea/dataview-core";
import {
  DataViewContent,
  SimpleDataViewProvider,
} from "@sparkyidea/dataview-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { NotionToolbar } from "@/components/dataview/toolbars/notion/toolbar";
import { GalleryView } from "@/components/dataview/views/gallery-view/gallery-view";
import { TableView } from "@/components/dataview/views/table-view/table-view";

interface Product {
  category: string;
  id: string;
  name: string;
  price: number;
}

export const properties: readonly DataViewProperty<Product>[] = [
  { id: "name", name: "Name", type: "text" },
  { id: "price", name: "Price", type: "number" },
  {
    id: "category",
    name: "Category",
    type: "select",
    config: {
      options: [
        { value: "Lighting", color: "yellow-subtle" },
        { value: "Furniture", color: "blue" },
      ],
    },
  },
];

const data: Product[] = [
  { id: "1", name: "Lamp", price: 12, category: "Lighting" },
  { id: "2", name: "Desk", price: 80, category: "Furniture" },
];

/** Two independent views on one page, each with in-memory state. */
export function App({ queryClient = new QueryClient() }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<p>loading</p>}>
        <SimpleDataViewProvider data={data} properties={properties}>
          <div className="flex flex-col gap-2" data-view="table">
            <NotionToolbar enableSettings />
            <DataViewContent>
              <TableView pagination="page" />
            </DataViewContent>
          </div>
        </SimpleDataViewProvider>
        <SimpleDataViewProvider data={data} properties={properties}>
          <div className="flex flex-col gap-2" data-view="gallery">
            <NotionToolbar />
            <DataViewContent>
              <GalleryView />
            </DataViewContent>
          </div>
        </SimpleDataViewProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
