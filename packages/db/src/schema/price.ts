import { sql } from "drizzle-orm";
import {
	foreignKey,
	index,
	integer,
	numeric,
	pgTable,
	serial,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/pg-core";
import { product } from "./product";
import { restaurant } from "./restaurant";

export const price = pgTable(
	"price",
	{
		id: serial().primaryKey().notNull(),
		restaurantId: integer("restaurant_id").notNull(),
		productId: integer("product_id").notNull(),
		name: varchar({ length: 255 }),
		eatinPrice: numeric("eatin_price", { precision: 10, scale: 2 }),
		pickupPrice: numeric("pickup_price", { precision: 10, scale: 2 }),
		deliveryPrice: numeric("delivery_price", { precision: 10, scale: 2 }),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).default(sql`CURRENT_TIMESTAMP`),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => [
		index("idx_price_product_id").using(
			"btree",
			table.productId.asc().nullsLast().op("int4_ops")
		),
		foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "price_product_id_fkey",
		}),
		foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurant.id],
			name: "price_restaurant_id_fkey",
		}),
		unique("unique_restaurant_product").on(table.restaurantId, table.productId),
	]
);
