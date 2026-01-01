import { product } from "@ocean-dataview/db/schema/product";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import {
	createSearchParamsParsers,
	createSearchParamsSchema,
} from "../lib/search-params";

// Listing schemas

export const selectProductSchema = createSelectSchema(product);
export type SelectProduct = z.infer<typeof selectProductSchema>;

export const productSearchParamsSchema =
	createSearchParamsSchema(selectProductSchema);
export type productSearchParams = z.infer<typeof productSearchParamsSchema>;

export const productSearchParamsType =
	createSearchParamsParsers(selectProductSchema);
