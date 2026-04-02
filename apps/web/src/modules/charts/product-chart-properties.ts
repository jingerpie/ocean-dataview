"use client";

import type { DataViewProperty } from "@sparkyidea/dataview/types";

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
      { value: "Accessories", color: "blue" },
      { value: "Bottoms", color: "purple" },
      { value: "Dresses", color: "pink" },
      { value: "Footwear", color: "yellow" },
      { value: "Garden", color: "green" },
      { value: "Home", color: "teal" },
      { value: "Jewelry", color: "yellow" },
      { value: "Lingerie", color: "red" },
      { value: "Outerwear", color: "gray" },
      { value: "Tops", color: "blue" },
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
      { value: "In stock", color: "green" },
      { value: "Low stock", color: "yellow" },
      { value: "Out of stock", color: "red" },
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
