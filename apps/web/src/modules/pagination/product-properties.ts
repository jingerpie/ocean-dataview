import type { DataViewProperty } from "@ocean-dataview/dataview/types";
import type { AppRouter } from "@ocean-dataview/trpc/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;
type ProductWithVariants = RouterOutput["product"]["getMany"]["items"][number];

export type Product = ProductWithVariants;

export const productProperties = [
  {
    id: "name",
    label: "Name",
    type: "text",
  },
  {
    id: "tag",
    label: "Tag",
    type: "text",
  },
  {
    id: "type",
    label: "Type",
    type: "text",
  },
  {
    id: "familyGroup",
    label: "Family Group",
    type: "select",
    config: {
      options: [
        { value: "REGULAR_DRINK", color: "blue" },
        { value: "REGULAR_ENTREE", color: "red" },
        { value: "SHAKES", color: "purple" },
        { value: "BREAKFAST_ENTREE", color: "red" },
        { value: "DESSERT", color: "pink" },
        { value: "NON_PRODUCT", color: "gray" },
        { value: "FRIES", color: "yellow" },
        { value: "BREAKFAST_DRINK", color: "teal" },
        { value: "UNDEFINED", color: "gray" },
        { value: "BREAKFAST_SIDE", color: "green" },
      ],
    },
  },
  {
    id: "image",
    label: "Image",
    type: "filesMedia",
    value: (item) =>
      item.image
        ? `https://us-prod5-digitalasset-v2.s3.amazonaws.com/${item.image.replace(".jpg", "_270.jpg")}`
        : null,
  },
  {
    id: "minCalories",
    label: "Min Calories",
    type: "number",
  },
  {
    id: "maxCalories",
    label: "Max Calories",
    type: "number",
  },
  {
    id: "createdAt",
    label: "Created At",
    type: "date",
  },
  {
    id: "hasType",
    label: "Has Type",
    type: "checkbox",
    value: (item) => item.type !== "UNDEFINED",
  },
] as DataViewProperty<Product>[];
