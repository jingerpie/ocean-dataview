import { trpcServer } from "@hono/trpc-server";
import { env } from "@ocean-dataview/env/server";
import { createContext } from "@ocean-dataview/trpc/context";
import { appRouter } from "@ocean-dataview/trpc/routers/index";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		credentials: true,
	})
);

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	})
);

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
