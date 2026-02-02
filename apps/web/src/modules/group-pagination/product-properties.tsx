import { NumberProperty } from "@ocean-dataview/dataview/components/ui/properties/number-property";
import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { AppRouter } from "@ocean-dataview/trpc/routers/index";
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
  },
  {
    id: "stockLevel",
    label: "Stock Level",
    type: "number",
  },
  {
    id: "rating",
    label: "Rating",
    type: "number",
  },
  {
    id: "_totalWorth",
    label: "Total Worth",
    type: "formula",
    value: (property) => (
      <NumberProperty
        config={{
          numberFormat: "dollar",
          decimalPlaces: 2,
        }}
        value={(property.raw("price") ?? 0) * (property.raw("stockLevel") ?? 0)}
      />
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
        { value: "Footwear", color: "orange" },
        { value: "Garden", color: "green" },
        { value: "Home", color: "teal" },
        { value: "Jewelry", color: "yellow" },
        { value: "Lingerie", color: "red" },
        { value: "Outerwear", color: "gray" },
        { value: "Tops", color: "cyan" },
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
        { value: "Seasonal", color: "orange" },
      ],
    },
  },
  {
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
