"use client";

import { ChartView } from "@ocean-dataview/dataview/components/views/chart-view";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import { type Product, productTypeProperty } from "./product-chart-properties";

function ProductTypeChart() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({ limit: 200 }),
	);

	return (
		<ChartView<Product>
			data={data.items}
			properties={[productTypeProperty]}
			chartType="verticalBar"
			config={{
				xAxis: {
					whatToShow: { property: "type" },
					sortBy: "countDescending",
				},
				yAxis: {
					whatToShow: "count",
				},
				style: {
					color: "blue",
					height: "medium",
					gridLine: "horizontal",
					axisName: "both",
					dataLabels: true,
					caption: "Product Count by Type",
					showLegend: false,
				},
			}}
		/>
	);
}

export function ProductTypeVerticalChart() {
	return (
		<Suspense
			fallback={
				<div className="flex h-80 items-center justify-center rounded-lg border bg-muted/30">
					<p className="text-muted-foreground">Loading chart...</p>
				</div>
			}
		>
			<ProductTypeChart />
		</Suspense>
	);
}
