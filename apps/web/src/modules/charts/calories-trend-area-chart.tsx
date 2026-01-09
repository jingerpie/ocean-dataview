"use client";

import { AreaChartView } from "@ocean-dataview/dataview/components/views/area-chart-view";
import { ChartViewProvider } from "@ocean-dataview/dataview/lib/providers";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import {
	maxCaloriesProperty,
	type Product,
	productTypeProperty,
} from "./product-chart-properties";

const productProperties = [productTypeProperty, maxCaloriesProperty] as const;

function CaloriesTrendArea() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({ limit: 200 }),
	);

	return (
		<ChartViewProvider<Product, typeof productProperties>
			data={data.items}
			properties={productProperties}
		>
			<AreaChartView
				config={{
					xAxis: {
						whatToShow: { property: "type" },
						sortBy: "countDescending",
					},
					yAxis: {
						whatToShow: { property: "maxCalories", showAs: "average" },
					},
					style: {
						color: "purple",
						height: "medium",
						gridLine: "horizontal",
						axisName: "both",
						smoothLine: true,
						showLegend: false,
						showDots: true,
						caption: "Average Calories Trend by Type",
					},
				}}
			/>
		</ChartViewProvider>
	);
}

export function CaloriesTrendAreaChart() {
	return (
		<Suspense
			fallback={
				<div className="flex h-80 items-center justify-center rounded-lg border bg-muted/30">
					<p className="text-muted-foreground">Loading chart...</p>
				</div>
			}
		>
			<CaloriesTrendArea />
		</Suspense>
	);
}
