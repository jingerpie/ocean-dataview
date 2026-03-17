import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { source } from "@/lib/docs/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      sidebar={{
        className:
          "bg-transparent p-2 [&>div:first-child>div:first-child]:hidden",
        collapsible: false,
      }}
      themeSwitch={{
        enabled: false,
      }}
      tree={source.getPageTree()}
    >
      {children}
    </DocsLayout>
  );
}
