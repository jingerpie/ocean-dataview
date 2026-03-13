"use client";

import { ChartViewProvider } from "@sparkyidea/dataview/providers";
import { VerticalBarChartView } from "@sparkyidea/dataview/views/vertical-bar-chart-view";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import { categoryProperty } from "./product-chart-properties";

const productProperties = [categoryProperty] as const;

function ProductCategoryChart() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({ limit: 100 })
  );

  return (
    <ChartViewProvider data={data.items} properties={productProperties}>
      <VerticalBarChartView
        config={{
          xAxis: {
            whatToShow: { property: "category" },
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
            caption: "Product Count by Category",
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
      <ProductCategoryChart />
    </Suspense>
  );
}
