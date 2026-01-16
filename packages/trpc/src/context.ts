import type { Context as HonoContext } from "hono";

export interface CreateContextOptions {
	context?: HonoContext;
}

export function createContext(_context?: CreateContextOptions) {
	// No auth configured
	return {
		session: null,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
