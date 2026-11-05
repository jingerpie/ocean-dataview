"use client";

import type { DataViewProperty } from "@sparkyidea/dataview-core";

// Product type from database
export interface Product {
  availability: string | null;
  category: string | null;
  createdAt: string | null;
  featured: boolean | null;
  id: number;
  lastRestocked: string | null;
  price: number | null;
  productImage: string | null;
  productLink: string | null;
  productName: string | null;
  rating: number | null;
  stockLevel: number | null;
  supplierEmail: string | null;
  supplierPhone: string | null;
  tags: string[] | null;
  updatedAt: string | null;
}

// Property schema for charts
export const categoryProperty = {
  key: "category",
  id: "category",
  name: "Category",
  type: "select",
  config: {
    options: [
      { value: "Accessories", color: "blue-subtle" },
      { value: "Bottoms", color: "purple-subtle" },
      { value: "Dresses", color: "pink-subtle" },
      { value: "Footwear", color: "yellow-subtle" },
      { value: "Garden", color: "green-subtle" },
      { value: "Home", color: "teal-subtle" },
      { value: "Jewelry", color: "yellow-subtle" },
      { value: "Lingerie", color: "red-subtle" },
      { value: "Outerwear", color: "gray-subtle" },
      { value: "Tops", color: "blue-subtle" },
    ],
  },
} as const satisfies DataViewProperty<Product>;

export const availabilityProperty = {
  key: "availability",
  id: "availability",
  name: "Availability",
  type: "select",
  config: {
    options: [
      { value: "In stock", color: "green-subtle" },
      { value: "Low stock", color: "yellow-subtle" },
      { value: "Out of stock", color: "red-subtle" },
    ],
  },
} as const satisfies DataViewProperty<Product>;

export const priceProperty = {
  key: "price",
  id: "price",
  name: "Price",
  type: "number",
} as const satisfies DataViewProperty<Product>;

export const createdAtProperty = {
  key: "createdAt",
  id: "createdAt",
  name: "Created At",
  type: "date",
} as const satisfies DataViewProperty<Product>;
