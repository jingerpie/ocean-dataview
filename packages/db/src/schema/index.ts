import { sql } from "drizzle-orm";
import {
	foreignKey,
	index,
	integer,
	numeric,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const product = pgTable(
	"product",
	{
		id: integer().primaryKey().notNull(),
		name: varchar({ length: 255 }),
		tag: varchar({ length: 10 }),
		type: varchar({ length: 50 }),
		familyGroup: varchar("family_group", { length: 100 }),
		image: text(),
		minCalories: integer("min_calories"),
		maxCalories: integer("max_calories"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).default(sql`CURRENT_TIMESTAMP`),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).default(sql`CURRENT_TIMESTAMP`),
		pageId: uuid("page_id"),
	},
	(table) => [
		index("idx_product_family_group").using(
			"btree",
			table.familyGroup.asc().nullsLast().op("text_ops"),
		),
		index("idx_product_tag").using(
			"btree",
			table.tag.asc().nullsLast().op("text_ops"),
		),
		index("idx_product_type").using(
			"btree",
			table.type.asc().nullsLast().op("text_ops"),
		),
		unique("product_pageId_key").on(table.pageId),
		unique("product_page_id_key").on(table.pageId),
	],
);

export const restaurant = pgTable(
	"restaurant",
	{
		id: integer().primaryKey().notNull(),
		globalId: varchar("global_id", { length: 50 }),
		pageId: uuid("page_id"),
		name: varchar({ length: 255 }),
		area: varchar({ length: 100 }),
		addressLine1: varchar("address_line1", { length: 255 }),
		cityTown: varchar("city_town", { length: 100 }),
		state: varchar({ length: 10 }),
		zipCode: varchar("zip_code", { length: 20 }),
		phoneNumber: varchar("phone_number", { length: 20 }),
		latitude: numeric({ precision: 10, scale: 6 }),
		longitude: numeric({ precision: 10, scale: 6 }),
		timeZone: varchar("time_zone", { length: 10 }),
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
		index("idx_restaurants_area").using(
			"btree",
			table.area.asc().nullsLast().op("text_ops"),
		),
		index("idx_restaurants_city_town").using(
			"btree",
			table.cityTown.asc().nullsLast().op("text_ops"),
		),
		index("idx_restaurants_coordinates").using(
			"btree",
			table.latitude.asc().nullsLast().op("numeric_ops"),
			table.longitude.asc().nullsLast().op("numeric_ops"),
		),
		index("idx_restaurants_page_id").using(
			"btree",
			table.pageId.asc().nullsLast().op("uuid_ops"),
		),
		index("idx_restaurants_postal_zip").using(
			"btree",
			table.zipCode.asc().nullsLast().op("text_ops"),
		),
		index("idx_restaurants_sub_division").using(
			"btree",
			table.state.asc().nullsLast().op("text_ops"),
		),
		unique("restaurant_page_id_key").on(table.pageId),
	],
);

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
			table.productId.asc().nullsLast().op("int4_ops"),
		),
		index("idx_price_restaurant_id").using(
			"btree",
			table.restaurantId.asc().nullsLast().op("int4_ops"),
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
	],
);
