import { product } from "@sparkyidea/db/schema";
import type { z } from "zod";
import { createSearchParamsSchema } from "../lib/search-params";

export const productSearchParamsSchema = createSearchParamsSchema(product);
export type productSearchParams = z.infer<typeof productSearchParamsSchema>;
