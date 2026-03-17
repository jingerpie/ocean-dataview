import { ProductListDemo } from "./components/hybrid-list-demo";

interface ListPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListPage({ searchParams }: ListPageProps) {
  const params = await searchParams;

  return <ProductListDemo params={params} />;
}
