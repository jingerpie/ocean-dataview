import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CaloriesByTypeChart } from "@/modules/charts/calories-by-type-chart";
import { CaloriesTrendAreaChart } from "@/modules/charts/calories-trend-area-chart";
import { FamilyGroupHorizontalChart } from "@/modules/charts/family-group-horizontal-chart";
import { ProductTagDonutChart } from "@/modules/charts/product-tag-donut-chart";
import { ProductTypeDonutChart } from "@/modules/charts/product-type-donut-chart";
import { ProductTypeVerticalChart } from "@/modules/charts/product-type-vertical-chart";
import { ProductsOverTimeLineChart } from "@/modules/charts/products-over-time-line-chart";
import { getQueryClient, trpc } from "@/utils/trpc/server";

export default async function ChartsPage() {
	const queryClient = getQueryClient();

	// Prefetch product data for all charts
	void queryClient.prefetchQuery(
		trpc.product.getMany.queryOptions({ limit: 200 }),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<div className="container mx-auto space-y-8 py-8">
				<div>
					<h1 className="font-bold text-2xl">Product Analytics Dashboard</h1>
					<p className="text-muted-foreground">
						Visual insights into product distribution, nutrition, and categories
					</p>
				</div>

				{/* Bento Box Grid Layout */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{/* Large card - spans 2 columns on lg */}
					<div className="lg:col-span-2">
						<ProductTypeVerticalChart />
					</div>

					{/* Regular card */}
					<div>
						<ProductTypeDonutChart />
					</div>

					{/* Regular card */}
					<div>
						<CaloriesByTypeChart />
					</div>

					{/* Regular card */}
					<div>
						<ProductTagDonutChart />
					</div>

					{/* Tall card */}
					<div>
						<FamilyGroupHorizontalChart />
					</div>

					{/* Line chart - spans 2 columns on lg */}
					<div className="lg:col-span-2">
						<ProductsOverTimeLineChart />
					</div>

					{/* Area chart */}
					<div>
						<CaloriesTrendAreaChart />
					</div>
				</div>
			</div>
		</HydrationBoundary>
	);
}
