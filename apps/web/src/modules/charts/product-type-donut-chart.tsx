"use client";

import { ChartViewProvider } from "@sparkyidea/dataview/providers";
import { DonutChartView } from "@sparkyidea/dataview/views/donut-chart-view";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import { categoryProperty } from "./product-chart-properties";

const productProperties = [categoryProperty] as const;

function ProductCategoryDonut() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({ limit: 100 })
  );

  return (
    <ChartViewProvider data={data.items} properties={productProperties}>
      <DonutChartView
        config={{
          data: {
            whatToShow: { property: "category" },
            showAs: "count",
            sortBy: "countDescending",
          },
          style: {
            color: "colorful",
            height: "medium",
            caption: "Product Distribution by Category",
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
      <ProductCategoryDonut />
    </Suspense>
  );
}
