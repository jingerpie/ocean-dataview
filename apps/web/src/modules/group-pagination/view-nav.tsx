"use client";

import { ViewNav as ViewNavBase } from "@sparkyidea/ui/components/view-nav";
import { useSearchParams } from "next/navigation";

const paths = [
  { path: "/group-pagination/table", label: "Table" },
  { path: "/group-pagination/list", label: "List" },
  { path: "/group-pagination/gallery", label: "Gallery" },
  { path: "/group-pagination/board", label: "Board" },
];

export function ViewNav() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const suffix = queryString ? `?${queryString}` : "";

  const views = paths.map(({ path, label }) => ({
    value: `${path}${suffix}`,
    label,
  }));

  return <ViewNavBase views={views} />;
}
