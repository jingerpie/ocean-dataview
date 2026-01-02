import { Tabs, TabsContent } from "@ocean-dataview/ui/components/tabs";
import { ProductGroupPaginationBoard } from "@/modules/group-pagination/product-group-pagination-board";
import { ProductGroupPaginationGallery } from "@/modules/group-pagination/product-group-pagination-gallery";
import { ProductGroupPaginationList } from "@/modules/group-pagination/product-group-pagination-list";
import { ProductGroupPaginationTable } from "@/modules/group-pagination/product-group-pagination-table";

export default function GroupPaginationPage() {
	return (
		<Tabs defaultValue="table" className="w-full">
			<TabsContent value="table">
				<ProductGroupPaginationTable />
			</TabsContent>
			<TabsContent value="list">
				<ProductGroupPaginationList />
			</TabsContent>
			<TabsContent value="gallery">
				<ProductGroupPaginationGallery />
			</TabsContent>
			<TabsContent value="board">
				<ProductGroupPaginationBoard />
			</TabsContent>
		</Tabs>
	);
}
