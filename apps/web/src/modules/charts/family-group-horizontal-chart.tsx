"use client";

import { ChartView } from "@ocean-dataview/dataview/components/views/chart-view";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import { familyGroupProperty, type Product } from "./product-chart-properties";

function FamilyGroupHorizontal() {
	const trpc = useTRPC();
	const { data } = useSuspenseQuery(
		trpc.product.getMany.queryOptions({ limit: 200 }),
	);

	return (
		<ChartView<Product>
			data={data.items}
			properties={[familyGroupProperty]}
			chartType="horizontalBar"
			config={{
				xAxis: {
					whatToShow: "count",
				},
				yAxis: {
					whatToShow: { property: "familyGroup" },
					sortBy: "countDescending",
				},
				style: {
					color: "teal",
					height: "large",
					gridLine: "vertical",
					axisName: "none",
					dataLabels: true,
					caption: "Product Count by Family Group",
					showLegend: false,
				},
			}}
		/>
	);
}

export function FamilyGroupHorizontalChart() {
	return (
		<Suspense
			fallback={
				<div className="flex h-96 items-center justify-center rounded-lg border bg-muted/30">
					<p className="text-muted-foreground">Loading chart...</p>
				</div>
			}
		>
			<FamilyGroupHorizontal />
		</Suspense>
	);
}
