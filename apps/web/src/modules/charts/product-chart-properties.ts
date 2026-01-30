"use client";

import type { DataViewProperty } from "@ocean-dataview/dataview/types";

// Product type from database
export interface Product {
  id: number;
  productName: string | null;
  price: number | null;
  stockLevel: number | null;
  rating: number | null;
  category: string | null;
  tags: string[] | null;
  availability: string | null;
  lastRestocked: string | null;
  featured: boolean | null;
  productLink: string | null;
  productImage: string | null;
  supplierPhone: string | null;
  supplierEmail: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Property definitions for charts
export const categoryProperty = {
  id: "category",
  label: "Category",
  type: "select",
  config: {
    options: [
      { value: "Accessories", color: "blue" },
      { value: "Bottoms", color: "purple" },
      { value: "Dresses", color: "pink" },
      { value: "Footwear", color: "orange" },
      { value: "Garden", color: "green" },
      { value: "Home", color: "teal" },
      { value: "Jewelry", color: "yellow" },
      { value: "Lingerie", color: "red" },
      { value: "Outerwear", color: "gray" },
      { value: "Tops", color: "cyan" },
    ],
  },
} as const satisfies DataViewProperty<Product>;

export const availabilityProperty = {
  id: "availability",
  label: "Availability",
  type: "select",
  config: {
    options: [
      { value: "In stock", color: "green" },
      { value: "Low stock", color: "yellow" },
      { value: "Out of stock", color: "red" },
    ],
  },
} as const satisfies DataViewProperty<Product>;

export const priceProperty = {
  id: "price",
  label: "Price",
  type: "number",
} as const satisfies DataViewProperty<Product>;

export const stockLevelProperty = {
  id: "stockLevel",
  label: "Stock Level",
  type: "number",
} as const satisfies DataViewProperty<Product>;

export const ratingProperty = {
  id: "rating",
  label: "Rating",
  type: "number",
} as const satisfies DataViewProperty<Product>;

export const productNameProperty = {
  id: "productName",
  label: "Product Name",
  type: "text",
} as const satisfies DataViewProperty<Product>;

export const createdAtProperty = {
  id: "createdAt",
  label: "Created At",
  type: "date",
} as const satisfies DataViewProperty<Product>;
