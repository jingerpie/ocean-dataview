"use client";

import { LineChartView } from "@ocean-dataview/dataview/components/views/line-chart-view";
import { ChartViewProvider } from "@ocean-dataview/dataview/lib/providers";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import {
  createdAtProperty,
  productTypeProperty,
} from "./product-chart-properties";

const productProperties = [createdAtProperty, productTypeProperty] as const;

function ProductsOverTimeLine() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({ limit: 200 })
  );

  return (
    <ChartViewProvider data={data.items} properties={productProperties}>
      <LineChartView
        config={{
          xAxis: {
            whatToShow: { property: "createdAt", showAs: "month" },
            sortBy: "propertyAscending",
          },
          yAxis: {
            whatToShow: "count",
            groupBy: { property: "type" },
          },
          style: {
            color: "colorful",
            height: "medium",
            gridLine: "both",
            axisName: "both",
            smoothLine: true,
            showLegend: true,
            showDots: true,
            caption: "Products Added Over Time by Type",
          },
        }}
      />
    </ChartViewProvider>
  );
}

export function ProductsOverTimeLineChart() {
  return (
    <Suspense
      fallback={
        <div className="flex h-80 items-center justify-center rounded-lg border bg-muted/30">
          <p className="text-muted-foreground">Loading chart...</p>
        </div>
      }
    >
      <ProductsOverTimeLine />
    </Suspense>
  );
}
