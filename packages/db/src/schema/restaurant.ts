import { sql } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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
      table.area.asc().nullsLast().op("text_ops")
    ),
    index("idx_restaurants_city_town").using(
      "btree",
      table.cityTown.asc().nullsLast().op("text_ops")
    ),
    index("idx_restaurants_coordinates").using(
      "btree",
      table.latitude.asc().nullsLast().op("numeric_ops"),
      table.longitude.asc().nullsLast().op("numeric_ops")
    ),
    index("idx_restaurants_postal_zip").using(
      "btree",
      table.zipCode.asc().nullsLast().op("text_ops")
    ),
    index("idx_restaurants_sub_division").using(
      "btree",
      table.state.asc().nullsLast().op("text_ops")
    ),
    unique("restaurant_page_id_key").on(table.pageId),
  ]
);
