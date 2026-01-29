import { Property } from "@ocean-dataview/dataview/components/ui/properties/formula-property";
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
      return <Property.FilesMedia value={url} />;
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
  {
    id: "createdAt",
    label: "Created At",
    type: "date",
  },
] as DataViewProperty<Product>[];
