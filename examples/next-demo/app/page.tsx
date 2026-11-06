import { Suspense } from "react";
import { TasksView } from "./tasks-view";

export default function Page() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">DataView npm demo</h1>
        <p className="text-muted-foreground text-sm">
          Logic from <code>@jingerpie/dataview-core</code> and{" "}
          <code>@jingerpie/dataview-react</code> on npm; UI installed with{" "}
          <code>shadcn add</code>. State lives in the URL.
        </p>
      </header>
      <Suspense>
        <TasksView />
      </Suspense>
    </main>
  );
}
