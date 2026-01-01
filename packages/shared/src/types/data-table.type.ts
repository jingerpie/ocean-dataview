import type { FC, SVGProps } from "react";
import type { DataTableConfig } from "../config/data-table";

export interface Option {
	label: string;
	value: string;
	count?: number;
	icon?: FC<SVGProps<SVGSVGElement>>;
}

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export interface PropertySort<TData> {
	propertyId: Extract<keyof TData, string>;
	desc: boolean;
}

export interface PropertyFilter<TData> {
	propertyId: Extract<keyof TData, string>;
	value: string | string[];
	variant: FilterVariant;
	operator: FilterOperator;
	filterId: string;
}
