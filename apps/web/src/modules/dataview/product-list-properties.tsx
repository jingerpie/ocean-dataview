import { FilesMediaProperty } from "@sparkyidea/dataview/properties";
import type { DataViewProperty } from "@sparkyidea/dataview/types";
import type { AppRouter } from "@sparkyidea/trpc/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import { Edit, Eye } from "lucide-react";
import { toast } from "sonner";

type RouterOutput = inferRouterOutputs<AppRouter>;
type ProductWithVariants = RouterOutput["product"]["getMany"]["items"][number];

export type Product = ProductWithVariants;

export const productListProperties = [
  {
    id: "_formula",
    label: "Formula",
    type: "formula",
    value: (property, item) => (
      <div className="flex items-center gap-4">
        <FilesMediaProperty className="h-10 w-10" value={item.productImage} />
        {property("productName")}
      </div>
    ),
  },
  {
    id: "productName",
    label: "Text",
    type: "text",
    hidden: true,
  },
  {
    id: "productImage",
    label: "Files & Media",
    type: "filesMedia",
    hidden: true,
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
    id: "supplierPhone",
    label: "Phone",
    type: "phone",
  },
  {
    id: "actions",
    label: "Actions",
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
] as DataViewProperty<Product>[];
