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
      { value: "Burger", color: "red" },
      { value: "Chicken", color: "yellow" },
      { value: "Breakfast", color: "teal" },
      { value: "Side", color: "green" },
      { value: "Beverage", color: "blue" },
      { value: "McCafe", color: "purple" },
      { value: "Dessert", color: "pink" },
      { value: "Condiment", color: "gray" },
    ],
  },
} as const satisfies DataViewProperty<Product>;

export const productTagProperty = {
  id: "tag",
  label: "Product Tag",
  type: "select",
  config: {
    options: [
      { value: "Featured", color: "blue" },
      { value: "Limited Time", color: "red" },
      { value: "Value", color: "green" },
      { value: "Premium", color: "purple" },
      { value: "Seasonal", color: "yellow" },
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
