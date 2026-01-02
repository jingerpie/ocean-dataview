import { relations } from "drizzle-orm/relations";
import { price } from "../schema/price";
import { product } from "../schema/product";
import { restaurant } from "../schema/restaurant";

export const priceRelations = relations(price, ({ one }) => ({
	product: one(product, {
		fields: [price.productId],
		references: [product.id],
	}),
	restaurant: one(restaurant, {
		fields: [price.restaurantId],
		references: [restaurant.id],
	}),
}));

export const productRelations = relations(product, ({ many }) => ({
	prices: many(price),
}));

export const restaurantRelations = relations(restaurant, ({ many }) => ({
	prices: many(price),
}));
