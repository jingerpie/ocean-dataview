import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { dbReady } from "@/server/db";
import { appRouter } from "@/server/router";

export const runtime = "nodejs";

async function handler(req: Request) {
  await dbReady;
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
  });
}

export { handler as GET, handler as POST };
