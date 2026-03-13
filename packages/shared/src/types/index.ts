// biome-ignore lint/performance/noBarrelFile: Shared types public API
export * from "./filter.type";
export * from "./group-config";
export * from "./group-schema";
export * from "./pagination.type";
export * from "./product.type";

export interface SearchParams {
  [key: string]: string | string[] | undefined;
}
