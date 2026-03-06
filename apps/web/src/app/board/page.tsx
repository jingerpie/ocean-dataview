import { ProductBoardDemo } from "./components/hybrid-board-demo";

interface BoardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const params = await searchParams;

  return <ProductBoardDemo params={params} />;
}
