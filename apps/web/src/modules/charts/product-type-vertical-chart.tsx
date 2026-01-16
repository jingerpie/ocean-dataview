"use client";

import { VerticalBarChartView } from "@ocean-dataview/dataview/components/views/vertical-bar-chart-view";
import { ChartViewProvider } from "@ocean-dataview/dataview/lib/providers";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import { productTypeProperty } from "./product-chart-properties";

const productProperties = [productTypeProperty] as const;

function ProductTypeChart() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({ limit: 200 })
	);

	return (
		<ChartViewProvider data={data.items} properties={productProperties}>
			<VerticalBarChartView
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
		</ChartViewProvider>
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
