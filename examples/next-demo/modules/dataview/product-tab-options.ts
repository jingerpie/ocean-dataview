import type { TabOption } from "./dataview-tab";

/**
 * Product tab options showcasing various dataview functionalities:
 * - Grouping (By Status)
 * - Simple filters (In Stock Jewelry)
 * - Sorting (Price Low to High, Price High to Low)
 * - Advanced filters with date ranges and multiple conditions (Seasonal Leftovers)
 */
export const productTabOptions: TabOption[] = [
  // Default: no filters, sorts, or grouping
  { label: "All", group: null, filter: null, sort: null },

  // Grouping example
  {
    label: "By Status",
    group: {
      propertyType: "status",
      propertyId: "availability",
      showAs: "option",
    },
  },

  // Simple filter: category + availability
  {
    label: "In Stock Jewelry",
    filter: [
      {
        and: [
          { property: "category", condition: "eq", value: "Jewelry" },
          { property: "availability", condition: "eq", value: "In stock" },
        ],
      },
    ],
  },

  // Multi-sort: price ascending, then by stock level descending
  {
    label: "Cheap to Expensive",
    sort: [
      { property: "price", direction: "asc" },
      { property: "stockLevel", direction: "desc" },
    ],
  },

  // Combined simple filter + advanced filter + sort
  {
    label: "2025 Seasonal Leftovers",
    filter: [
      // Simple filter: Seasonal tag
      { property: "tags", condition: "inArray", value: ["Seasonal"] },
      // Advanced filter: nested AND with OR inside
      {
        and: [
          // Date range: 2025 (using isBetween)
          {
            property: "lastRestocked",
            condition: "isBetween",
            value: ["2025-01-01", "2025-12-31"],
          },
          // Low stock or out of stock (nested OR)
          {
            or: [
              { property: "availability", condition: "eq", value: "Low stock" },
              {
                property: "availability",
                condition: "eq",
                value: "Out of stock",
              },
            ],
          },
        ],
      },
    ],
    // Sort by stock level ascending (lowest inventory first)
    sort: [{ property: "stockLevel", direction: "asc" }],
  },
];
