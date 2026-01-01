import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

// Re-export context types and functions
export { type Context, createContext } from "./context";

const t = initTRPC.context<Context>().create({
	/**
	 * @see https://trpc.io/docs/server/data-transformers
	 */
	transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
