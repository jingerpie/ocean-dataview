"use client";

import { HorizontalBarChartView } from "@ocean-dataview/dataview/components/views/horizontal-bar-chart-view";
import { ChartViewProvider } from "@ocean-dataview/dataview/lib/providers";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import { categoryProperty } from "./product-chart-properties";

const productProperties = [categoryProperty] as const;

function CategoryHorizontal() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({ limit: 200 })
  );

  return (
    <ChartViewProvider data={data.items} properties={productProperties}>
      <HorizontalBarChartView
        config={{
          xAxis: {
            whatToShow: "count",
          },
          yAxis: {
            whatToShow: { property: "category" },
            sortBy: "countDescending",
          },
          style: {
            color: "teal",
            height: "large",
            gridLine: "vertical",
            axisName: "none",
            dataLabels: true,
            caption: "Product Count by Category",
            showLegend: false,
          },
        }}
      />
    </ChartViewProvider>
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
      <CategoryHorizontal />
    </Suspense>
  );
}
