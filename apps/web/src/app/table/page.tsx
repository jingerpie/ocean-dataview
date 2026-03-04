import { HybridTableDemo } from "./components/hybrid-table-demo";

interface TablePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TablePage({ searchParams }: TablePageProps) {
  const params = await searchParams;

  return (
    // <Tabs defaultValue="hybrid">
    //   <TabsContent value="flat">
    //     <FlatTableDemo params={params} />
    //   </TabsContent>
    //   <TabsContent value="group">
    //     <GroupTableDemo params={params} />
    //   </TabsContent>
    //   <TabsContent value="hybrid">
    //     <HybridTableDemo params={params} />
    //   </TabsContent>
    // </Tabs>
    <HybridTableDemo params={params} />
  );
}
