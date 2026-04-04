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
    key: "productName",
    name: "Text",
    type: "text",
  },
  {
    key: "price",
    name: "Number",
    type: "number",
    config: {
      numberFormat: "dollar",
      decimalPlaces: 2,
    },
  },
  {
    key: "stockLevel",
    name: "Number (Bar)",
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
    key: "rating",
    name: "Number (Ring)",
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
    key: "category",
    name: "Select",
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
    key: "tags",
    name: "Multi Select",
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
    key: "availability",
    name: "Status",
    type: "status",
    config: {
      groups: [
        {
          name: "Available",
          color: "green",
          options: ["In stock"],
          icon: CheckCircle2,
        },
        {
          name: "Warning",
          color: "yellow",
          options: ["Low stock"],
          icon: AlertCircle,
        },
        {
          name: "Unavailable",
          color: "red",
          options: ["Out of stock"],
          icon: XCircle,
        },
      ],
    },
  },
  {
    key: "lastRestocked",
    name: "Date",
    type: "date",
  },
  {
    key: "featured",
    name: "Checkbox",
    type: "checkbox",
  },
  {
    key: "productImage",
    name: "Files & Media",
    type: "filesMedia",
  },
  {
    key: "productLink",
    name: "URL",
    type: "url",
    enableGroup: false,
  },
  {
    key: "supplierPhone",
    name: "Phone",
    type: "phone",
  },
  {
    key: "supplierEmail",
    name: "Email",
    type: "email",
  },
  {
    id: "_totalWorth",
    name: "Formula",
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
] as DataViewProperty<Product>[];
