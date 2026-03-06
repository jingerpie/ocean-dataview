import type { PropertyType } from "../../types";

/**
 * Skeleton widths for row-based layouts (Table columns, List flex rows)
 * Used by: TableSkeleton, ListSkeleton
 */
export const ROW_SKELETON_WIDTHS: Record<PropertyType, string> = {
  checkbox: "40px",
  button: "80px",
  filesMedia: "80px",
  number: "100px",
  date: "120px",
  select: "120px",
  status: "120px",
  phone: "120px",
  multiSelect: "160px",
  email: "180px",
  url: "180px",
  text: "150px",
  formula: "100px",
};

/**
 * Skeleton widths for card-based layouts (stacked properties in cards)
 * Used by: GallerySkeleton, BoardSkeleton
 */
export const CARD_SKELETON_WIDTHS: Record<PropertyType, string> = {
  checkbox: "24px",
  button: "80px",
  filesMedia: "48px",
  number: "60px",
  date: "140px",
  select: "80px",
  status: "80px",
  phone: "120px",
  multiSelect: "160px",
  email: "180px",
  url: "140px",
  text: "75%",
  formula: "100%",
};

/**
 * Row pattern variation for List skeleton (visual variety)
 * Each row uses a different starting offset into the property widths
 */
export const ROW_PATTERNS = [0, 1, 2] as const;
