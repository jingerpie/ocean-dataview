"use client";

import type { DataViewProperty } from "@ocean-dataview/dataview/types";

// Product type from database
export interface Product {
	id: number;
	name: string | null;
	tag: string | null;
	type: string | null;
	familyGroup: string | null;
	image: string | null;
	minCalories: number | null;
	maxCalories: number | null;
	createdAt: string | null;
	updatedAt: string | null;
}

// Property definitions for charts
export const productTypeProperty = {
	id: "type",
	label: "Product Type",
	type: "select",
	config: {
		options: [
			{ value: "Burger", label: "Burger", color: "red" },
			{ value: "Chicken", label: "Chicken", color: "yellow" },
			{ value: "Breakfast", label: "Breakfast", color: "teal" },
			{ value: "Side", label: "Side", color: "green" },
			{ value: "Beverage", label: "Beverage", color: "blue" },
			{ value: "McCafe", label: "McCafe", color: "purple" },
			{ value: "Dessert", label: "Dessert", color: "pink" },
			{ value: "Condiment", label: "Condiment", color: "gray" },
		],
	},
} as const satisfies DataViewProperty<Product>;

export const productTagProperty = {
	id: "tag",
	label: "Product Tag",
	type: "select",
	config: {
		options: [
			{ value: "Featured", label: "Featured", color: "blue" },
			{ value: "Limited Time", label: "Limited Time", color: "red" },
			{ value: "Value", label: "Value", color: "green" },
			{ value: "Premium", label: "Premium", color: "purple" },
			{ value: "Seasonal", label: "Seasonal", color: "yellow" },
		],
	},
} as const satisfies DataViewProperty<Product>;

export const familyGroupProperty = {
	id: "familyGroup",
	label: "Family Group",
	type: "text",
} as const satisfies DataViewProperty<Product>;

export const maxCaloriesProperty = {
	id: "maxCalories",
	label: "Max Calories",
	type: "number",
} as const satisfies DataViewProperty<Product>;

export const minCaloriesProperty = {
	id: "minCalories",
	label: "Min Calories",
	type: "number",
} as const satisfies DataViewProperty<Product>;

export const nameProperty = {
	id: "name",
	label: "Name",
	type: "text",
} as const satisfies DataViewProperty<Product>;

export const createdAtProperty = {
	id: "createdAt",
	label: "Created At",
	type: "date",
} as const satisfies DataViewProperty<Product>;
