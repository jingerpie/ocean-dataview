# Plan: Property Size & Card Layout

## Context

Currently, property widths are hardcoded per-type in `skeleton-widths.ts` (3 maps: `TABLE_COLUMN_WIDTHS`, `ROW_SKELETON_WIDTHS`, `CARD_SKELETON_WIDTHS`). There is no per-property `size` field — every `text` column is always 200px, every `number` is 150px, etc. Card views (Board/Gallery) render properties in a simple `flex-col` stack with no layout variation.

## Goals

1. Add `size` to `BaseProperty` — aligns with TanStack's `ColumnDef.size/minSize/maxSize`
2. Keep skeleton width maps as fallbacks when `size` is not set
3. Skeleton rendering reads property `size` first, falls back to type-based defaults
4. Add `cardLayout` to Board and Gallery views (Notion-style: `list` vs `compact`)

---

## Step 1: Add `size` to BaseProperty

**File:** `packages/dataview/src/types/property.type.ts`

Add to `BaseProperty<T>`:
```ts
/**
 * Display size/width for this property (in pixels).
 * - Table: maps to TanStack ColumnDef.size (column width)
 * - List: used as flex-basis for non-first properties
 * - Card (Board/Gallery): used as width hint in compact layout
 * Falls back to type-based defaults from skeleton-widths.ts when omitted.
 */
size?: number;
```

Mirror in `PropertyMeta`:
```ts
/** Display size/width in pixels */
size?: number;
```

**Why `size` (number, pixels) not `width`:**
- TanStack `ColumnDef` uses `size`, `minSize`, `maxSize` — all numbers in px
- A single `size` value can serve as width in table, flex-basis in list, and width hint in cards
- Keeps it generic enough for future height usage (e.g., card image heights)

**Not adding `minSize`/`maxSize` yet** — YAGNI. Can add later if column resizing is needed.

---

## Step 2: Wire `size` into table column width calculation

**File:** `packages/dataview/src/components/views/table-view/data-table.tsx`

Update `calculateColumnWidth()`:
```ts
function calculateColumnWidth(
  propertyType: PropertyType | undefined,
  headerLabel: string | undefined,
  propertySize: number | undefined  // NEW
): number | undefined {
  if (!propertyType) return undefined;

  // Property-level size takes priority over type defaults
  const baseWidth = propertySize ?? TABLE_COLUMN_WIDTHS[propertyType];
  const headerWidth = headerLabel
    ? headerLabel.length * TABLE_HEADER_CHAR_WIDTH + TABLE_HEADER_PADDING
    : 0;

  return Math.min(Math.max(baseWidth, headerWidth), TABLE_HEADER_MAX_WIDTH);
}
```

**File:** `packages/dataview/src/components/views/table-view/index.tsx`

Pass `property.size` through `ColumnDef.meta`:
```ts
meta: {
  propertyType: property.type,
  propertySize: property.size,  // NEW
  wrap: resolvedWrap,
}
```

This aligns with TanStack's model — `meta` carries custom data, and our `calculateColumnWidth` consumes it alongside `propertyType`.

---

## Step 3: Wire `size` into list row widths

**File:** `packages/dataview/src/components/views/list-view/list-row.tsx`

For non-first properties (currently unstyled with no explicit width), use `property.size` with fallback:
```ts
style={
  isFirst
    ? { minWidth: ROW_SKELETON_WIDTHS[property.type] }
    : { width: property.size ?? undefined }  // Use size if provided
}
```

---

## Step 4: Skeleton fallback chain

**Files:**
- `packages/dataview/src/components/views/table-view/table-skeleton.tsx`
- `packages/dataview/src/components/views/list-view/list-skeleton.tsx`
- `packages/dataview/src/components/views/gallery-view/gallery-skeleton.tsx`
- `packages/dataview/src/components/views/board-view/board-skeleton.tsx`

Skeletons don't have access to property instances (they render before data loads), so they continue using the type-based maps (`ROW_SKELETON_WIDTHS`, `CARD_SKELETON_WIDTHS`) as-is. No change needed — the skeleton maps ARE the fallback.

**Runtime rendering** (DataTable, ListRow, DataCard) will read `property.size` first, fall back to the skeleton maps.

---

## Step 5: Add `cardLayout` type

**File:** `packages/dataview/src/types/property.type.ts` (or new file `packages/dataview/src/types/card-layout.type.ts`)

```ts
/**
 * Card layout mode for Board and Gallery views.
 * - "list": Properties stack vertically, one per line (flex-col). Default behavior.
 * - "compact": Properties flow in a wrapping row (flex-wrap). Better density.
 */
export type CardLayout = "list" | "compact";
```

---

## Step 6: Add `cardLayout` prop to GalleryView and BoardView

**Files:**
- `packages/dataview/src/components/views/gallery-view/index.tsx`
- `packages/dataview/src/components/views/board-view/index.tsx`

Add to both view props:
```ts
/**
 * Card layout mode
 * - "list": Properties stack vertically, one per line
 * - "compact": Properties flow in a wrapping row
 * @default "list"
 */
cardLayout?: CardLayout;
```

Pass through to `DataCard`:
```ts
<DataCard
  cardLayout={cardLayout}
  // ...existing props
/>
```

---

## Step 7: Update DataCard to support cardLayout

**File:** `packages/dataview/src/components/views/data-card.tsx`

Add `cardLayout` prop to `DataCardProps`:
```ts
/**
 * Card layout mode
 * @default "list"
 */
cardLayout?: CardLayout;
```

Update the CardContent rendering:

```tsx
{/* list = flex-col (current), compact = flex-wrap */}
<CardContent
  className={cn(
    "flex gap-2 p-3",
    cardLayout === "compact" ? "flex-wrap items-center" : "flex-col"
  )}
>
  {displayProperties.map((property, propIndex) => {
    const isFirst = propIndex === 0;

    return (
      <div
        className={cn(
          "min-w-0",
          cardLayout === "compact"
            ? "shrink-0"  // compact: inline items
            : "flex w-full flex-col items-start",  // list: full width stack
          isFirst && "font-medium",
          // ...existing gap logic for select/status types
        )}
        style={
          cardLayout === "compact" && property.size
            ? { width: property.size }
            : undefined
        }
        key={String(property.id)}
      >
        {/* ...existing showName + DataCell rendering */}
      </div>
    );
  })}
</CardContent>
```

In `compact` mode:
- First property still gets full width (via `w-full basis-full`) as the card title
- Subsequent properties flow inline with `flex-wrap`
- `property.size` controls inline width — this is where `size` becomes most useful outside tables

In `list` mode:
- Unchanged from current behavior (vertical stack)

---

## Step 8: Update skeleton for compact layout

**Files:**
- `packages/dataview/src/components/views/gallery-view/gallery-skeleton.tsx`
- `packages/dataview/src/components/views/board-view/board-skeleton.tsx`

Add `cardLayout` prop. When `compact`, render skeleton bars in a `flex-wrap` row instead of `flex-col`.

---

## File Change Summary

| File | Change |
|------|--------|
| `types/property.type.ts` | Add `size?: number` to `BaseProperty` and `PropertyMeta` |
| `types/card-layout.type.ts` | New file: `CardLayout` type (or inline in property.type.ts) |
| `table-view/data-table.tsx` | `calculateColumnWidth` reads `propertySize` from meta |
| `table-view/index.tsx` | Pass `property.size` in `ColumnDef.meta` |
| `list-view/list-row.tsx` | Use `property.size` for non-first property widths |
| `data-card.tsx` | Add `cardLayout` prop, conditional flex-col vs flex-wrap |
| `gallery-view/index.tsx` | Add `cardLayout` prop, pass to DataCard |
| `board-view/index.tsx` | Add `cardLayout` prop, pass to DataCard |
| `gallery-view/gallery-skeleton.tsx` | Support compact skeleton layout |
| `board-view/board-skeleton.tsx` | Support compact skeleton layout |

## Migration

**Non-breaking.** All changes are additive:
- `size` is optional — omit it and everything works as before
- `cardLayout` defaults to `"list"` — current behavior preserved
- No changes to data layer, URL params, or tRPC

## Open Questions

1. **Should `size` also affect card image height?** Currently `imageHeight` comes from `cardSize` presets. Could allow per-card override but adds complexity.
2. **Should compact layout's first property always be full-width?** Notion does this. Makes sense as a card "title" row.
3. **Max width cap for `size` in tables?** Currently capped at 300px via `TABLE_HEADER_MAX_WIDTH`. Should `property.size` be able to override this cap?
