import { ProductTableDemo } from "./components/hybrid-table-demo";

interface TablePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TablePage({ searchParams }: TablePageProps) {
  const params = await searchParams;

  return <ProductTableDemo params={params} />;
}
