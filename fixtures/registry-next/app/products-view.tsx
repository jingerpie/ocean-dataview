"use client";

import type { DataViewProperty, Limit } from "@sparkyidea/dataview-core";
import {
  DataViewContent,
  SimpleDataViewProvider,
} from "@sparkyidea/dataview-react";
import { useNuqsDataViewState } from "@sparkyidea/dataview-react/nuqs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { NotionToolbar } from "@/shared/components/dataview/toolbars/notion/toolbar";
import { TableView } from "@/shared/components/dataview/views/table-view/table-view";

interface Product {
  id: string;
  name: string;
  status: string;
}

const properties: readonly DataViewProperty<Product>[] = [
  { id: "name", name: "Name", type: "text" },
  {
    id: "status",
    name: "Status",
    type: "status",
    config: {
      groups: [{ color: "green", name: "Done", options: ["shipped"] }],
    },
  },
];

const data: Product[] = [{ id: "1", name: "Lamp", status: "shipped" }];

export function ProductsView({ limit }: { limit: Limit }) {
  const [queryClient] = useState(() => new QueryClient());
  const state = useNuqsDataViewState({ urlPrefix: "p." });
  return (
    <QueryClientProvider client={queryClient}>
      <p>limit {limit}</p>
      <Suspense fallback={<p>loading</p>}>
        <SimpleDataViewProvider
          data={data}
          properties={properties}
          state={state}
        >
          <div className="flex flex-col gap-2">
            <NotionToolbar enableSettings />
            <DataViewContent>
              <TableView pagination="page" />
            </DataViewContent>
          </div>
        </SimpleDataViewProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
