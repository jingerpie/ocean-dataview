"use client";

import {
  DataViewContent,
  SimpleDataViewProvider,
} from "@jingerpie/dataview-react";
import { useNuqsDataViewState } from "@jingerpie/dataview-react/nuqs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense, useState } from "react";
import { TableSkeleton } from "@/components/dataview/skeletons/table-skeleton";
import { NotionToolbar } from "@/components/dataview/toolbars/notion/toolbar";
import { GalleryView } from "@/components/dataview/views/gallery-view/gallery-view";
import { ListView } from "@/components/dataview/views/list-view/list-view";
import { TableView } from "@/components/dataview/views/table-view/table-view";
import { Button } from "@/components/ui/button";
import { taskProperties, tasks } from "./tasks";

const VIEWS = ["table", "list", "gallery"] as const;

export function TasksView() {
  const [queryClient] = useState(() => new QueryClient());
  const state = useNuqsDataViewState();
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEWS).withDefault("table")
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex gap-1">
        {VIEWS.map((v) => (
          <Button
            key={v}
            onClick={() => setView(v)}
            size="sm"
            variant={v === view ? "secondary" : "ghost"}
          >
            {v[0]?.toUpperCase()}
            {v.slice(1)}
          </Button>
        ))}
      </div>
      <Suspense
        fallback={
          <TableSkeleton
            pagination="page"
            properties={taskProperties}
            rowCount={10}
          />
        }
      >
        <SimpleDataViewProvider
          data={tasks}
          properties={taskProperties}
          state={state}
        >
          <div className="flex flex-col gap-2">
            <NotionToolbar enableSettings />
            <DataViewContent>
              {view === "table" && (
                <TableView pagination="page" showVerticalLines={false} />
              )}
              {view === "list" && <ListView pagination="page" />}
              {view === "gallery" && <GalleryView pagination="page" />}
            </DataViewContent>
          </div>
        </SimpleDataViewProvider>
      </Suspense>
    </QueryClientProvider>
  );
}
