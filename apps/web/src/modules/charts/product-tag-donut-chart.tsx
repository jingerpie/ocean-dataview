"use client";

import { ChartViewProvider } from "@sparkyidea/dataview/providers";
import { DonutChartView } from "@sparkyidea/dataview/views/donut-chart-view";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useTRPC } from "@/utils/trpc/client";

import { availabilityProperty } from "./product-chart-properties";

const productProperties = [availabilityProperty] as const;

function ProductAvailabilityDonut() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.product.getMany.queryOptions({ limit: 200 })
  );

  return (
    <ChartViewProvider data={data.items} properties={productProperties}>
      <DonutChartView
        config={{
          data: {
            whatToShow: { property: "availability" },
            showAs: "count",
            sortBy: "countDescending",
            omitZeroValues: true,
          },
          style: {
            color: "colorful",
            height: "medium",
            caption: "Product Distribution by Availability",
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
      <ProductAvailabilityDonut />
    </Suspense>
  );
}
