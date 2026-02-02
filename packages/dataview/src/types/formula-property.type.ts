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
  value: unknown;
}

export interface NumberPropertyComponentProps
  extends BasePropertyComponentProps {
  value: unknown;
  config?: NumberConfig;
}

export interface SelectPropertyComponentProps
  extends BasePropertyComponentProps {
  value: unknown;
  config?: SelectConfig;
}

export interface MultiSelectPropertyComponentProps
  extends BasePropertyComponentProps {
  value: unknown;
  config?: MultiSelectConfig;
}

export interface StatusPropertyComponentProps
  extends BasePropertyComponentProps {
  value: unknown;
  config?: StatusConfig;
}

export interface DatePropertyComponentProps extends BasePropertyComponentProps {
  value: unknown;
  config?: DateConfig;
}

export interface CheckboxPropertyComponentProps
  extends BasePropertyComponentProps {
  value: unknown;
}

export interface UrlPropertyComponentProps extends BasePropertyComponentProps {
  value: unknown;
  config?: UrlConfig;
}

export interface EmailPropertyComponentProps
  extends BasePropertyComponentProps {
  value: unknown;
}

export interface PhonePropertyComponentProps
  extends BasePropertyComponentProps {
  value: unknown;
}

export interface FilesMediaPropertyComponentProps
  extends BasePropertyComponentProps {
  value: unknown;
}

/**
 * Mapped type for property component props
 * More maintainable than deeply nested conditional types
 */
interface PropertyComponentPropsMap {
  text: TextPropertyComponentProps;
  number: NumberPropertyComponentProps;
  select: SelectPropertyComponentProps;
  multiSelect: MultiSelectPropertyComponentProps;
  status: StatusPropertyComponentProps;
  date: DatePropertyComponentProps;
  checkbox: CheckboxPropertyComponentProps;
  url: UrlPropertyComponentProps;
  email: EmailPropertyComponentProps;
  phone: PhonePropertyComponentProps;
  filesMedia: FilesMediaPropertyComponentProps;
  formula: never; // Formula type doesn't use these props
}

/**
 * Get property component props for a given property type
 */
export type PropertyComponentProps<T extends PropertyType> =
  PropertyComponentPropsMap[T];
