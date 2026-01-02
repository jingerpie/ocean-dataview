import { TabsList, TabsTrigger } from "@ocean-dataview/ui/components/tabs";

export const PaginationTabs = () => {
	return (
		<TabsList>
			<TabsTrigger value="table">Table</TabsTrigger>
			<TabsTrigger value="list">List</TabsTrigger>
			<TabsTrigger value="gallery">Gallery</TabsTrigger>
		</TabsList>
	);
};
