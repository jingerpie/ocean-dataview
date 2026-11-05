import {
  type DataViewProperty,
  UNGROUPED_KEY,
  type WhereNode,
} from "@jingerpie/dataview-core";
import {
  DataViewContent,
  type DataViewStateAdapter,
  EMPTY_DATA_VIEW_STATE,
  SimpleDataViewProvider,
  useFilterParams,
  useGroupQuery,
  useLocalDataViewState,
} from "@jingerpie/dataview-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ComponentType, Suspense, type SVGProps } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: string;
}

const StarIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} />
);

// Status group `icon` is typed as a React component through the
// DataViewRegister augmentation shipped by @jingerpie/dataview-react.
export const properties: readonly DataViewProperty<Product>[] = [
  { id: "name", name: "Name", type: "text" },
  { id: "price", name: "Price", type: "number" },
  {
    id: "stock",
    name: "Stock",
    type: "status",
    config: {
      groups: [
        { color: "green", icon: StarIcon, name: "In stock", options: ["in"] },
      ],
    },
  },
];

const data: Product[] = [
  { id: "1", name: "Lamp", price: 12, stock: "in" },
  { id: "2", name: "Desk", price: 80, stock: "in" },
];

export const initialFilter: WhereNode[] = [
  { property: "price", condition: "gt", value: 10 },
];

function Rows() {
  const { data: rows } = useGroupQuery<Product>({ groupKey: UNGROUPED_KEY });
  const { filter } = useFilterParams();
  return (
    <ul data-filter={JSON.stringify(filter)}>
      {rows.map((row) => (
        <li key={row.id}>{row.name}</li>
      ))}
    </ul>
  );
}

export function App({ queryClient = new QueryClient() }) {
  // Controlled, non-URL state: no nuqs installed in this fixture.
  const state: DataViewStateAdapter = useLocalDataViewState({
    ...EMPTY_DATA_VIEW_STATE,
    filter: initialFilter,
  });

  return (
    <QueryClientProvider client={queryClient}>
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
