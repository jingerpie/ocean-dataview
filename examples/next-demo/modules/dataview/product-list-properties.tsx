import type { DataViewProperty } from "@jingerpie/dataview-core";
import type { inferRouterOutputs } from "@trpc/server";
import { Edit, Eye } from "lucide-react";
import { toast } from "sonner";
import { FilesMediaProperty } from "@/components/dataview/properties/files-media-property";
import type { AppRouter } from "@/server/router";
import { productProperties } from "./product-properties";

type RouterOutput = inferRouterOutputs<AppRouter>;
type ProductWithVariants = RouterOutput["product"]["getMany"]["items"][number];

export type Product = ProductWithVariants;

/**
 * Properties the preset tabs group, sort, and filter by. The list does not
 * display them, but they must exist or validation drops those presets.
 */
const presetOnlyProperties = productProperties
  .filter((property) =>
    ["availability", "lastRestocked", "price", "stockLevel"].includes(
      property.key ?? ""
    )
  )
  .map((property) => ({ ...property, hidden: true }));

export const productListProperties = [
  {
    id: "_formula",
    name: "Formula",
    type: "formula",
    value: (property, item) => (
      <div className="flex items-center gap-4">
        <FilesMediaProperty className="h-10 w-10" value={item.productImage} />
        {property("productName")}
      </div>
    ),
  },
  {
    key: "productName",
    name: "Text",
    type: "text",
    hidden: true,
  },
  {
    key: "productImage",
    name: "Files & Media",
    type: "filesMedia",
    hidden: true,
  },
  {
    key: "category",
    name: "Select",
    type: "select",
    config: {
      options: [
        { value: "Accessories", color: "blue-subtle" },
        { value: "Bottoms", color: "purple-subtle" },
        { value: "Dresses", color: "pink-subtle" },
        { value: "Footwear", color: "yellow-subtle" },
        { value: "Garden", color: "green-subtle" },
        { value: "Home", color: "teal-subtle" },
        { value: "Jewelry", color: "gray-subtle" },
        { value: "Lingerie", color: "red-subtle" },
        { value: "Outerwear", color: "gray-subtle" },
        { value: "Tops", color: "blue-subtle" },
      ],
    },
  },
  {
    key: "tags",
    name: "Multi Select",
    type: "multiSelect",
    config: {
      options: [
        { value: "Bestseller", color: "yellow-subtle" },
        { value: "Eco-friendly", color: "green-subtle" },
        { value: "Limited Edition", color: "purple-subtle" },
        { value: "New Arrival", color: "blue-subtle" },
        { value: "On Sale", color: "red-subtle" },
        { value: "Seasonal", color: "pink-subtle" },
      ],
    },
  },
  {
    key: "supplierPhone",
    name: "Phone",
    type: "phone",
  },
  {
    id: "actions",
    name: "Actions",
    type: "button",
    value: (item) => [
      {
        label: "View",
        icon: Eye,
        onClick: () => toast.info(`Viewing: ${item.productName}`),
      },
      {
        label: "Edit",
        icon: Edit,
        onClick: () => toast.info(`Editing: ${item.productName}`),
      },
    ],
  },
  ...presetOnlyProperties,
] as DataViewProperty<Product>[];
