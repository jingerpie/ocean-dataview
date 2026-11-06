import { createDataViewParamsCache } from "@jingerpie/dataview-react/nuqs/server";
import { ProductsView } from "./products-view";

const paramsCache = createDataViewParamsCache({ urlPrefix: "p." });

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { limit } = await paramsCache.parse(searchParams);
  return <ProductsView limit={limit} />;
}
