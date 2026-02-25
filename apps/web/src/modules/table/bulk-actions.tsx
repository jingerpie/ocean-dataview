import type { BulkAction } from "@sparkyidea/dataview/types";
import { Edit, Eye, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/properties/product-properties";

export const bulkActions: BulkAction<Product>[] = [
  {
    label: "View",
    icon: <Eye className="h-4 w-4" />,
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
    onClick: () => toast("Feature action (demo)"),
  },
  {
    label: "Delete",
    icon: <Trash2 className="h-4 w-4" />,
    variant: "destructive",
    onClick: () => toast("Delete action (demo)"),
  },
];
