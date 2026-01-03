"use client";

import { Toaster } from "@ocean-dataview/dataview/components/sonner";
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
			enableSystem
			storageKey="dashseller-theme"
			defaultTheme="system"
			disableTransitionOnChange
		>
			<TRPCReactProvider>
				{children}
				<ReactQueryDevtools />
			</TRPCReactProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
