import type {
  DateConfig,
  MultiSelectConfig,
  NumberConfig,
  PropertyType,
  SelectConfig,
  StatusConfig,
  UrlConfig,
} from "./property.type";

/**
 * Base props that all property components share
 */
export interface BasePropertyComponentProps {
  className?: string;
}

/**
 * Individual property component prop interfaces
 */
export interface TextPropertyComponentProps extends BasePropertyComponentProps {
  value: string | null;
}

export interface NumberPropertyComponentProps
  extends BasePropertyComponentProps {
  config?: NumberConfig;
  value: number | null;
}

export interface SelectPropertyComponentProps
  extends BasePropertyComponentProps {
  config?: SelectConfig;
  value: string | null;
}

export interface MultiSelectPropertyComponentProps
  extends BasePropertyComponentProps {
  config?: MultiSelectConfig;
  value: string[];
}

export interface StatusPropertyComponentProps
  extends BasePropertyComponentProps {
  config?: StatusConfig;
  value: string | null;
}

export interface DatePropertyComponentProps extends BasePropertyComponentProps {
  config?: DateConfig;
  value: Date | null;
}

export interface CheckboxPropertyComponentProps
  extends BasePropertyComponentProps {
  value: boolean | null;
}

export interface UrlPropertyComponentProps extends BasePropertyComponentProps {
  config?: UrlConfig;
  value: string | null;
}

export interface EmailPropertyComponentProps
  extends BasePropertyComponentProps {
  value: string | null;
}

export interface PhonePropertyComponentProps
  extends BasePropertyComponentProps {
  value: string | null;
}

export interface FilesMediaPropertyComponentProps
  extends BasePropertyComponentProps {
  value: string[];
}

/**
 * Mapped type for property component props
 * More maintainable than deeply nested conditional types
 */
interface PropertyComponentPropsMap {
  button: never; // Button type uses ButtonConfig with item, not value props
  checkbox: CheckboxPropertyComponentProps;
  date: DatePropertyComponentProps;
  email: EmailPropertyComponentProps;
  filesMedia: FilesMediaPropertyComponentProps;
  formula: never; // Formula type doesn't use these props
  multiSelect: MultiSelectPropertyComponentProps;
  number: NumberPropertyComponentProps;
  phone: PhonePropertyComponentProps;
  select: SelectPropertyComponentProps;
  status: StatusPropertyComponentProps;
  text: TextPropertyComponentProps;
  url: UrlPropertyComponentProps;
}

/**
 * Get property component props for a given property type
 */
export type PropertyComponentProps<T extends PropertyType> =
  PropertyComponentPropsMap[T];
