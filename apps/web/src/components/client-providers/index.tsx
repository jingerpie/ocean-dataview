"use client";

import { Toaster } from "@sparkyidea/ui/components/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TRPCReactProvider } from "@/utils/trpc/client";
import { ThemeProvider } from "./theme-provider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      storageKey="dashseller-theme"
    >
      <TRPCReactProvider>
        {children}
        <ReactQueryDevtools />
      </TRPCReactProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
