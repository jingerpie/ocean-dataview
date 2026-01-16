"use client";
import { env } from "@ocean-dataview/env/web";
import type { AppRouter } from "@ocean-dataview/trpc/routers/index";
// ^-- to make sure we can mount the Provider from a server component
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
let browserQueryClient: QueryClient;

// Standalone trpc client for direct API calls (e.g., infinite queries)
let apiClient: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

export function getApiClient() {
	if (typeof window === "undefined") {
		// Server: create new client each time
		return createTRPCClient<AppRouter>({
			links: [
				httpBatchLink({
					url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
					transformer: superjson,
				}),
			],
		});
	}
	// Browser: singleton
	if (!apiClient) {
		apiClient = createTRPCClient<AppRouter>({
			links: [
				httpBatchLink({
					url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
					fetch(url, options) {
						return fetch(url, {
							...options,
							credentials: "include",
						});
					},
					transformer: superjson,
				}),
			],
		});
	}
	return apiClient;
}

function getQueryClient() {
	if (typeof window === "undefined") {
		// Server: always make a new query client
		return makeQueryClient();
	}
	// Browser: make a new query client if we don't already have one
	// This is very important, so we don't re-make a new client if React
	// suspends during the initial render. This may not be needed if we
	// have a suspense boundary BELOW the creation of the query client
	if (!browserQueryClient) {
		browserQueryClient = makeQueryClient();
	}
	return browserQueryClient;
}

export function TRPCReactProvider(
	props: Readonly<{
		children: React.ReactNode;
	}>
) {
	// NOTE: Avoid useState when initializing the query client if you don't
	//       have a suspense boundary between this and the code that may
	//       suspend because React will throw away the client on the initial
	//       render if it suspends and there is no boundary
	const queryClient = getQueryClient();
	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links: [
				httpBatchLink({
					url: `${env.NEXT_PUBLIC_SERVER_URL}/trpc`,
					fetch(url, options) {
						return fetch(url, {
							...options,
							credentials: "include",
						});
					},
					transformer: superjson,
				}),
			],
		})
	);
	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
				{props.children}
			</TRPCProvider>
		</QueryClientProvider>
	);
}
