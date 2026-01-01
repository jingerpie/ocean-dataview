export * from "./channel.type";
export * from "./data-table.type";
export * from "./listing.type";
export * from "./pagination.type";

export interface SearchParams {
	[key: string]: string | string[] | undefined;
}
