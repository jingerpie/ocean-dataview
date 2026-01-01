export * from "./data-table.type";
export * from "./pagination.type";
export * from "./product.type";

export interface SearchParams {
	[key: string]: string | string[] | undefined;
}
