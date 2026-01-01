import { listing } from "@ocean-dataview/db/schema/listing";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import {
	createSearchParamsParsers,
	createSearchParamsSchema,
} from "../lib/search-params";

// Listing schemas

export const selectListingSchema = createSelectSchema(listing);
export type SelectListing = z.infer<typeof selectListingSchema>;

export const listingSearchParamsSchema =
	createSearchParamsSchema(selectListingSchema);
export type listingSearchParams = z.infer<typeof listingSearchParamsSchema>;

export const listingSearchParamsCache =
	createSearchParamsParsers(selectListingSchema);
