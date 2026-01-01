import { sql } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
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
	],
);
