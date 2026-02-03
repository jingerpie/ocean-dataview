import { product } from "@sparkyidea/db/schema/product";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { createSearchParamsSchema } from "../lib/search-params";

export const selectProductSchema = createSelectSchema(product);
export type SelectProduct = z.infer<typeof selectProductSchema>;

export const productSearchParamsSchema =
  createSearchParamsSchema(selectProductSchema);
export type productSearchParams = z.infer<typeof productSearchParamsSchema>;
