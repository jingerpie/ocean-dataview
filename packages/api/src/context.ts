export async function createContext() {
	return {};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
