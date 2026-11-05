import type { ComponentType, ReactNode, SVGProps } from "react";

declare module "../../types/register" {
  interface DataViewRegister {
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    node: ReactNode;
  }
}
