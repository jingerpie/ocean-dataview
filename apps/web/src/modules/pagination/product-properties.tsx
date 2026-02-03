import { NumberProperty } from "@sparkyidea/dataview/properties";
import type { DataViewProperty } from "@sparkyidea/dataview/types";
import type { AppRouter } from "@sparkyidea/trpc/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;
type ProductWithVariants = RouterOutput["product"]["getMany"]["items"][number];

export type Product = ProductWithVariants;

export const productProperties = [
  {
    id: "productName",
    label: "Product Name",
    type: "text",
  },
  {
    id: "price",
    label: "Price",
    type: "number",
    config: {
      numberFormat: "dollar",
      decimalPlaces: 2,
    },
  },
  {
    id: "stockLevel",
    label: "Stock Level",
    type: "number",
    config: {
      showAs: {
        type: "bar",
        color: "red",
        divideBy: 100,
      },
    },
  },
  {
    id: "rating",
    label: "Rating",
    type: "number",
    config: {
      showAs: {
        type: "ring",
        color: "green",
        divideBy: 100,
      },
    },
  },
  {
    id: "_totalWorth",
    label: "Total Worth",
    type: "formula",
    value: (property) => (
      <div className="flex flex-col items-center gap-2">
        <NumberProperty
          config={{
            numberFormat: "dollar",
            decimalPlaces: 2,
          }}
          value={
            (property.raw("price") ?? 0) * (property.raw("stockLevel") ?? 0)
          }
        />
        {property("rating")}
      </div>
    ),
  },
  {
    id: "category",
    label: "Category",
    type: "select",
    config: {
      options: [
        { value: "Accessories", color: "blue" },
        { value: "Bottoms", color: "purple" },
        { value: "Dresses", color: "pink" },
        { value: "Footwear", color: "yellow" },
        { value: "Garden", color: "green" },
        { value: "Home", color: "teal" },
        { value: "Jewelry", color: "gray" },
        { value: "Lingerie", color: "red" },
        { value: "Outerwear", color: "gray" },
        { value: "Tops", color: "blue" },
      ],
    },
  },
  {
    id: "tags",
    label: "Tags",
    type: "multiSelect",
    config: {
      options: [
        { value: "Bestseller", color: "yellow" },
        { value: "Eco-friendly", color: "green" },
        { value: "Limited Edition", color: "purple" },
        { value: "New Arrival", color: "blue" },
        { value: "On Sale", color: "red" },
        { value: "Seasonal", color: "pink" },
      ],
    },
  },
  {
    id: "availability",
    label: "Availability",
    type: "status",
    config: {
      groups: [
        { label: "Available", color: "green", options: ["In stock"] },
        { label: "Warning", color: "yellow", options: ["Low stock"] },
        { label: "Unavailable", color: "red", options: ["Out of stock"] },
      ],
    },
  },
  {
    id: "lastRestocked",
    label: "Last Restocked",
    type: "date",
  },
  {
    id: "featured",
    label: "Featured",
    type: "checkbox",
  },
  {
    id: "productImage",
    label: "Product Image",
    type: "filesMedia",
  },
  {
    id: "productLink",
    label: "Product Link",
    type: "url",
  },
  {
    id: "supplierPhone",
    label: "Supplier Phone",
    type: "phone",
  },
  {
    id: "supplierEmail",
    label: "Supplier Email",
    type: "email",
  },
  {
    id: "createdAt",
    label: "Created At",
    type: "date",
  },
] as DataViewProperty<Product>[];
