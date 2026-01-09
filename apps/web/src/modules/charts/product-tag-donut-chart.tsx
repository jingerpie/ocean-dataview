"use client";

import { DonutChartView } from "@ocean-dataview/dataview/components/views/donut-chart-view";
import { ChartViewProvider } from "@ocean-dataview/dataview/lib/providers";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

// Use text property to show all tag values dynamically
const tagProperty = {
	id: "tag",
	label: "Product Tag",
	type: "text",
} as const;

const productProperties = [tagProperty] as const;

function ProductTagDonut() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({ limit: 200 }),
	);

	return (
		<ChartViewProvider data={data.items} properties={productProperties}>
			<DonutChartView
				config={{
					data: {
						whatToShow: { property: "tag" },
						showAs: "count",
						sortBy: "countDescending",
						omitZeroValues: true,
					},
					style: {
						color: "colorful",
						height: "medium",
						caption: "Product Distribution by Tag",
						showLegend: true,
						dataLabelFormat: "nameAndValue",
					},
				}}
			/>
		</ChartViewProvider>
	);
}

export function ProductTagDonutChart() {
	return (
		<Suspense
			fallback={
				<div className="flex h-80 items-center justify-center rounded-lg border bg-muted/30">
					<p className="text-muted-foreground">Loading chart...</p>
				</div>
			}
		>
			<ProductTagDonut />
		</Suspense>
	);
}
