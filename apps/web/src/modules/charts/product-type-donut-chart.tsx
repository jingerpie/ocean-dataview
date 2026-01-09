"use client";

import { ChartView } from "@ocean-dataview/dataview/components/views/chart-view";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import { type Product, productTypeProperty } from "./product-chart-properties";

function ProductTypeDonut() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({ limit: 200 }),
	);

	return (
		<ChartView<Product>
			data={data.items}
			properties={[productTypeProperty]}
			chartType="donut"
			config={{
				data: {
					whatToShow: { property: "type" },
					showAs: "count",
					sortBy: "countDescending",
				},
				style: {
					color: "colorful",
					height: "medium",
					caption: "Product Distribution by Type",
					showLegend: true,
				},
			}}
		/>
	);
}

export function ProductTypeDonutChart() {
	return (
		<Suspense
			fallback={
				<div className="flex h-80 items-center justify-center rounded-lg border bg-muted/30">
					<p className="text-muted-foreground">Loading chart...</p>
				</div>
			}
		>
			<ProductTypeDonut />
		</Suspense>
	);
}
