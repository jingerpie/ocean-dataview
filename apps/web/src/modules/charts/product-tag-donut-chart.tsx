"use client";

import { ChartView } from "@ocean-dataview/dataview/components/views/chart-view";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import type { Product } from "./product-chart-properties";

// Use text property to show all tag values dynamically
const tagProperty = {
	id: "tag",
	label: "Product Tag",
	type: "text",
} as const satisfies DataViewProperty<Product>;

function ProductTagDonut() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({ limit: 200 }),
	);

	return (
		<ChartView<Product>
			data={data.items}
			properties={[tagProperty]}
			chartType="donut"
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
