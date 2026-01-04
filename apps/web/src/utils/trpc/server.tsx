import "server-only"; // <-- ensure this file cannot be imported from the client
import { createContext } from "@ocean-dataview/trpc";
import { appRouter } from "@ocean-dataview/trpc/routers/index";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { makeQueryClient } from "./query-client";

export const createTRPCContext = cache(async () => {
	return await createContext();
});

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);
export const trpc = createTRPCOptionsProxy({
	ctx: createTRPCContext,
	router: appRouter,
	queryClient: getQueryClient,
});
