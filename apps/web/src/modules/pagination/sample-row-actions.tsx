import type { Action } from "@sparkyidea/dataview/types";
import { Edit, Eye, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "./product-properties";

export const sampleRowActions: Action<Product>[] = [
  {
    label: "View",
    icon: <Eye className="h-4 w-4" />,
    primary: true,
    onClick: () => toast("View action (demo)"),
  },
  {
    label: "Edit",
    icon: <Edit className="h-4 w-4" />,
    onClick: () => toast("Edit action (demo)"),
  },
  {
    label: "Feature",
    icon: <Star className="h-4 w-4" />,
    bulkOnly: true,
    onClick: () => toast("Feature action (demo)"),
  },
  {
    label: "Delete",
    icon: <Trash2 className="h-4 w-4" />,
    variant: "destructive",
    onClick: () => toast("Delete action (demo)"),
  },
];
