import type { PropertyType } from "../../types";

/**
 * Fixed column widths for table columns based on property type (in pixels)
 * Used as minimum width; actual width may be larger if header label is wider
 */
export const TABLE_COLUMN_WIDTHS: Record<PropertyType, number> = {
  checkbox: 32,
  button: 200,
  filesMedia: 100,
  number: 150,
  date: 200,
  select: 150,
  status: 150,
  phone: 200,
  multiSelect: 200,
  email: 200,
  url: 200,
  text: 200,
  formula: 300,
};

/**
 * Average character width for estimating header label width (in pixels)
 */
export const TABLE_HEADER_CHAR_WIDTH = 8;

/**
 * Padding added to header label width calculation (in pixels)
 */
export const TABLE_HEADER_PADDING = 24;

/**
 * Maximum width for table header/column (in pixels)
 */
export const TABLE_HEADER_MAX_WIDTH = 300;

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
