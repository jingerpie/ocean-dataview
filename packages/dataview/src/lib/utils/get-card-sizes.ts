/**
 * Shared card size configurations for Board and Gallery views
 */

export type CardSize = "small" | "medium" | "large";

export interface BoardCardDimensions {
  imageHeight: number;
  columnWidth: string; // Tailwind class e.g., "w-64"
}

export interface GalleryCardDimensions {
  imageHeight: number;
  cols: string; // Tailwind grid classes
}

/**
 * Board view card dimensions by size
 */
export const BOARD_CARD_SIZES: Record<CardSize, BoardCardDimensions> = {
  small: { imageHeight: 120, columnWidth: "w-64" }, // 256px
  medium: { imageHeight: 150, columnWidth: "w-80" }, // 320px
  large: { imageHeight: 200, columnWidth: "w-96" }, // 384px
};

/**
 * Gallery view card dimensions by size
 */
export const GALLERY_CARD_SIZES: Record<CardSize, GalleryCardDimensions> = {
  small: {
    imageHeight: 150,
    cols: "grid-cols-1 sm:grid-cols-3 lg:grid-cols-5",
  },
  medium: {
    imageHeight: 200,
    cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  },
  large: {
    imageHeight: 260,
    cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  },
};

/**
 * Get board card dimensions by size
 */
export function getBoardCardDimensions(
  cardSize: CardSize = "medium"
): BoardCardDimensions {
  return BOARD_CARD_SIZES[cardSize];
}

/**
 * Get gallery card dimensions by size
 */
export function getGalleryCardDimensions(
  cardSize: CardSize = "medium"
): GalleryCardDimensions {
  return GALLERY_CARD_SIZES[cardSize];
}
