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
    // text type is searchable by default, no need for allowSearch: true
  },
  {
    id: "tag",
    label: "Tag",
    type: "select",
  },
  {
    id: "type",
    label: "Type",
    type: "select",
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
    type: "text",
    hidden: true, // Hidden - used by imageDisplay formula
    enableSearch: false,
    enableFilter: false,
    enableSort: false,
  },
  {
    id: "imageDisplay",
    label: "Image",
    type: "formula",
    value: (property) => {
      const image = property.raw("image");
      if (!image) {
        return null;
      }
      const url = `https://us-prod5-digitalasset-v2.s3.amazonaws.com/${image.replace(".jpg", "_270.jpg")}`;
      // biome-ignore lint/performance/noImgElement: Demo file using external image URL
      // biome-ignore lint/correctness/useImageSize: Demo file with CSS dimensions
      return <img alt="" className="h-8 w-8 rounded object-cover" src={url} />;
    },
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
] as DataViewProperty<Product>[];
