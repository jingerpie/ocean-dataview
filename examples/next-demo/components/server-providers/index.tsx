import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function ServerProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
