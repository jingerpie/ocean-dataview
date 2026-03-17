import { RootProvider } from "fumadocs-ui/provider/next";

export default function DocsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootProvider>{children}</RootProvider>;
}
