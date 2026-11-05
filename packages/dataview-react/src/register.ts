import type { ComponentType, ReactNode, SVGProps } from "react";

declare module "@sparkyidea/dataview-core/register" {
  interface DataViewRegister {
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    node: ReactNode;
  }
}
