import { Tabs, TabsContent } from "@ocean-dataview/ui/components/tabs";
import { ProductGroupPaginationBoard } from "@/modules/pagination/product-group-pagination-board";
import { ProductPaginationGallery } from "@/modules/pagination/product-pagination-gallery";
import { ProductPaginationList } from "@/modules/pagination/product-pagination-list";
import { ProductPaginationTable } from "@/modules/pagination/product-pagination-table";

export default function PaginationPage() {
	return (
		<Tabs defaultValue="table" className="w-full">
			<TabsContent value="table">
				<ProductPaginationTable />
			</TabsContent>
			<TabsContent value="list">
				<ProductPaginationList />
			</TabsContent>
			<TabsContent value="gallery">
				<ProductPaginationGallery />
			</TabsContent>
			<TabsContent value="board">
				<ProductGroupPaginationBoard />
			</TabsContent>
		</Tabs>
	);
}
