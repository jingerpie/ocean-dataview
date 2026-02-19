import { FilesMediaProperty } from "@sparkyidea/dataview/properties";
import type { DataViewProperty } from "@sparkyidea/dataview/types";
import type { AppRouter } from "@sparkyidea/trpc/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import { AlertCircle, CheckCircle2, Edit, Eye, XCircle } from "lucide-react";
import { toast } from "sonner";

type RouterOutput = inferRouterOutputs<AppRouter>;
type ProductWithVariants = RouterOutput["product"]["getMany"]["items"][number];

export type Product = ProductWithVariants;

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
    id: "stockLevel",
    label: "Number (Bar)",
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
    label: "Number (Ring)",
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
  {
    id: "productImage",
    label: "Files & Media",
    type: "filesMedia",
  },
  {
    id: "productLink",
    label: "URL",
    type: "url",
  },
  {
    id: "supplierPhone",
    label: "Phone",
    type: "phone",
  },
  {
    id: "supplierEmail",
    label: "Email",
    type: "email",
  },
  {
    id: "_totalWorth",
    label: "Formula",
    type: "formula",
    value: (property, item) => (
      <div className="flex items-center gap-4">
        <FilesMediaProperty className="h-10 w-10" value={item.productImage} />
        <div className="flex flex-col items-start justify-center gap-2">
          {property("productName")}
          <div className="flex items-center gap-2">
            {property("price")}
            {property("category")}
            {property("availability")}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "actions",
    label: "Actions",
    type: "button",
    config: {
      buttons: [
        {
          label: "View",
          icon: Eye,
          onClick: (item: Product) => {
            toast.info(`Viewing: ${item.productName}`);
          },
        },
        {
          label: "Edit",
          icon: Edit,
          onClick: (item: Product) => {
            toast.info(`Editing: ${item.productName}`);
          },
        },
      ],
    },
  },
] as DataViewProperty<Product>[];
