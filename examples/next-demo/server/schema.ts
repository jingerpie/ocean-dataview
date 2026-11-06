import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const product = pgTable("product", {
  id: serial().primaryKey(),
  productName: varchar("product_name", { length: 255 }),
  price: doublePrecision(),
  stockLevel: integer("stock_level"),
  rating: integer(),
  category: varchar({ length: 100 }),
  tags: text().array(),
  availability: varchar({ length: 50 }),
  lastRestocked: date("last_restocked"),
  featured: boolean(),
  productLink: text("product_link"),
  productImage: text("product_image"),
  supplierPhone: varchar("supplier_phone", { length: 50 }),
  supplierEmail: varchar("supplier_email", { length: 255 }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`CURRENT_TIMESTAMP`),
});
