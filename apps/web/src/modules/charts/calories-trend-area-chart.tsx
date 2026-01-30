"use client";

import { AreaChartView } from "@ocean-dataview/dataview/components/views/area-chart-view";
import { ChartViewProvider } from "@ocean-dataview/dataview/lib/providers";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import { categoryProperty, priceProperty } from "./product-chart-properties";

const productProperties = [categoryProperty, priceProperty] as const;

function PriceTrendArea() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({ limit: 200 })
  );

  return (
    <ChartViewProvider data={data.items} properties={productProperties}>
      <AreaChartView
        config={{
          xAxis: {
            whatToShow: { property: "category" },
            sortBy: "countDescending",
          },
          yAxis: {
            whatToShow: { property: "price", showAs: "average" },
          },
          style: {
            color: "purple",
            height: "medium",
            gridLine: "horizontal",
            axisName: "both",
            smoothLine: true,
            showLegend: false,
            showDots: true,
            caption: "Average Price Trend by Category",
          },
        }}
      />
    </ChartViewProvider>
  );
}

export function PriceTrendAreaChart() {
  return (
    <Suspense
      fallback={
        <div className="flex h-80 items-center justify-center rounded-lg border bg-muted/30">
          <p className="text-muted-foreground">Loading chart...</p>
        </div>
      }
    >
      <PriceTrendArea />
    </Suspense>
  );
}
