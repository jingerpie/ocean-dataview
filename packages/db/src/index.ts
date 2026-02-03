import { env } from "@sparkyidea/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

// biome-ignore lint/performance/noNamespaceImport: Drizzle requires all schema exports as a single object
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });
