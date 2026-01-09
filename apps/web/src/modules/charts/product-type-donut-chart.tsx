"use client";

import { DonutChartView } from "@ocean-dataview/dataview/components/views/donut-chart-view";
import { ChartViewProvider } from "@ocean-dataview/dataview/lib/providers";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import { productTypeProperty } from "./product-chart-properties";

const productProperties = [productTypeProperty] as const;

function ProductTypeDonut() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({ limit: 200 }),
	);

	return (
		<ChartViewProvider data={data.items} properties={productProperties}>
			<DonutChartView
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
		</ChartViewProvider>
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
