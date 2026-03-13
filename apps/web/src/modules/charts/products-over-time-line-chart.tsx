"use client";

import { ChartViewProvider } from "@sparkyidea/dataview/providers";
import { LineChartView } from "@sparkyidea/dataview/views/line-chart-view";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import {
  categoryProperty,
  createdAtProperty,
} from "./product-chart-properties";

const productProperties = [createdAtProperty, categoryProperty] as const;

function ProductsOverTimeLine() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({ limit: 100 })
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
            groupBy: { property: "category" },
          },
          style: {
            color: "colorful",
            height: "medium",
            gridLine: "both",
            axisName: "both",
            smoothLine: true,
            showLegend: true,
            showDots: true,
            caption: "Products Added Over Time by Category",
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
