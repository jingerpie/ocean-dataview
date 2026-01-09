"use client";

import { ChartView } from "@ocean-dataview/dataview/components/views/chart-view";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import {
	createdAtProperty,
	type Product,
	productTypeProperty,
} from "./product-chart-properties";

function ProductsOverTimeLine() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({ limit: 200 }),
	);

	return (
		<ChartView<Product>
			data={data.items}
			properties={[createdAtProperty, productTypeProperty]}
			chartType="line"
			config={{
				xAxis: {
					whatToShow: { property: "createdAt", showAs: "month" },
					sortBy: "propertyAscending",
				},
				yAxis: {
					whatToShow: "count",
					groupBy: { property: "type" },
				},
				style: {
					color: "colorful",
					height: "medium",
					gridLine: "both",
					axisName: "both",
					smoothLine: true,
					showLegend: true,
					showDots: true,
					caption: "Products Added Over Time by Type",
				},
			}}
		/>
	);
}

export function ProductsOverTimeLineChart() {
	return (
		<Suspense
			fallback={
				<div className="flex h-80 items-center justify-center rounded-lg border bg-muted/30">
					<p className="text-muted-foreground">Loading chart...</p>
				</div>
			}
		>
			<ProductsOverTimeLine />
		</Suspense>
	);
}
