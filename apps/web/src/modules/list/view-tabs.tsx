import { TabsList, TabsTrigger } from "@sparkyidea/ui/components/tabs";

/**
 * Reusable tabs for switching between list view modes.
 * Pass as children to NotionToolbar.
 */
export function ViewTabs() {
  return (
    <TabsList>
      <TabsTrigger value="flat">Flat</TabsTrigger>
      <TabsTrigger value="group">Group</TabsTrigger>
      <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
    </TabsList>
  );
}
