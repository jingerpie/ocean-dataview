import { TabsList, TabsTrigger } from "@sparkyidea/ui/components/tabs";

export const GroupPaginationTabs = () => {
  return (
    <TabsList>
      <TabsTrigger value="table">Table</TabsTrigger>
      <TabsTrigger value="list">List</TabsTrigger>
      <TabsTrigger value="gallery">Gallery</TabsTrigger>
      <TabsTrigger value="board">Board</TabsTrigger>
    </TabsList>
  );
};
