import { relations } from "drizzle-orm/relations";
import { price, product, restaurant } from "../schema";

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
