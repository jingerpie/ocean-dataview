"use client";

import {
  type DataViewProperty,
  type Limit,
  UNGROUPED_KEY,
} from "@jingerpie/dataview-core";
import {
  DataViewContent,
  SimpleDataViewProvider,
  useGroupQuery,
} from "@jingerpie/dataview-react";
import { useNuqsDataViewState } from "@jingerpie/dataview-react/nuqs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState } from "react";

interface Product {
  id: string;
  name: string;
}

const properties: readonly DataViewProperty<Product>[] = [
  { id: "name", name: "Name", type: "text" },
];

const data: Product[] = [{ id: "1", name: "Lamp" }];

function Rows() {
  const { data: rows } = useGroupQuery<Product>({ groupKey: UNGROUPED_KEY });
  return (
    <ul>
      {rows.map((row) => (
        <li key={row.id}>{row.name}</li>
      ))}
    </ul>
  );
}

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
          <DataViewContent>
            <Rows />
          </DataViewContent>
        </SimpleDataViewProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
