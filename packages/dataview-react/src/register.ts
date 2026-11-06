import type { ComponentType, ReactNode, SVGProps } from "react";

declare module "@jingerpie/dataview-core/register" {
  interface DataViewRegister {
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    node: ReactNode;
  }
}
