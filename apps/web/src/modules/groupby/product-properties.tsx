import type { DataViewProperty } from "@sparkyidea/dataview/types";
import type { AppRouter } from "@sparkyidea/trpc/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

type RouterOutput = inferRouterOutputs<AppRouter>;
type ProductItem = RouterOutput["product"]["getMany"]["items"][number];

export type Product = ProductItem;

export const productProperties = [
  {
    id: "productName",
    label: "Text",
    type: "text",
  },
  {
    id: "price",
    label: "Number",
    type: "number",
    config: {
      numberFormat: "dollar",
      decimalPlaces: 2,
    },
  },
  {
    id: "category",
    label: "Select",
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
    label: "Multi Select",
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
    label: "Status",
    type: "status",
    config: {
      groups: [
        {
          label: "Available",
          color: "green",
          options: ["In stock"],
          icon: CheckCircle2,
        },
        {
          label: "Warning",
          color: "yellow",
          options: ["Low stock"],
          icon: AlertCircle,
        },
        {
          label: "Unavailable",
          color: "red",
          options: ["Out of stock"],
          icon: XCircle,
        },
      ],
    },
  },
  {
    id: "lastRestocked",
    label: "Date",
    type: "date",
  },
  {
    id: "featured",
    label: "Checkbox",
    type: "checkbox",
  },
] as DataViewProperty<Product>[];
