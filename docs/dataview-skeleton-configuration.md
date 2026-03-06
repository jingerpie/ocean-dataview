# DataView Skeleton Configuration Reference

This document maps each DataView's configurable props to its corresponding skeleton's props, highlighting what can be matched and what is currently hardcoded.

---

## Overview

| View | Skeleton | Skeleton Location |
|------|----------|-------------------|
| `BoardView` | `BoardSkeleton` | `board-view/board-skeleton.tsx` |
| `TableView` | `TableSkeleton` | `table-view/table-skeleton.tsx` |
| `ListView` | `ListSkeleton` | `list-view/list-skeleton.tsx` |
| `GalleryView` | `GallerySkeleton` | `gallery-view/gallery-skeleton.tsx` |
| Grouped modes | `GroupSectionSkeleton` | `ui/group-section-skeleton.tsx` |

---

## BoardView

### View Props (`BoardViewProps`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cardPreview` | `string` | - | Property ID for card preview image |
| `cardSize` | `"small" \| "medium" \| "large"` | `"medium"` | Card size preset |
| `colorColumns` | `boolean` | `false` | Color column backgrounds |
| `fitMedia` | `boolean` | `true` | Fit media to card |
| `pagination` | `PaginationMode` | - | Pagination style |
| `showPropertyNames` | `boolean` | `false` | Show property names on cards |
| `wrapAllProperties` | `boolean` | `false` | Wrap text in properties |

### Skeleton Props (`BoardSkeletonProps`)

| Prop | Type | Default | Source | Strategy |
|------|------|---------|--------|----------|
| `cardSize` | `"small" \| "medium" \| "large"` | `"medium"` | View config | ⚠️ Pass via `defaults.skeleton` |
| `cardsPerColumn` | `number` | `3` | `defaults.limit` | ✅ Use limit |
| `columnCount` | `number` | `4` | Query result | 🔢 Fixed fill (10) |
| `groupCount` | `number` | `0` | Query result | 🔢 Fixed fill (10) |
| `propertyCount` | `number` | `2` | `properties.length` | ✅ Use visible property count |
| `withImage` | `boolean` | `true` | View config | ⚠️ Pass via `defaults.skeleton` |

### Strategy Legend

- ✅ **Use directly** - Value is known at render time
- 🔢 **Fixed fill** - Use a number that fills the viewport (query result unknown)
- ⚠️ **Pass through** - Needs to be passed via `defaults.skeleton`

### Recommended Values (in DataViewProvider)

```tsx
<BoardSkeleton
  cardsPerColumn={limit}                           // ✅ From defaults.limit
  columnCount={10}                                 // 🔢 Fixed fill
  groupCount={isGrouped ? 10 : 0}                  // 🔢 Fixed fill when grouped
  propertyCount={visibleProperties.length}         // ✅ From properties
  // cardSize and withImage need defaults.skeleton
/>
```

### Current Implementation (in DataViewProvider)

```tsx
// Calculate skeleton values from known config
const limit = controllerProps.defaults?.limit ?? 10;
const visiblePropertyCount = properties.filter((p) => !p.hidden).length;

<BoardSkeleton
  cardsPerColumn={limit}                              // ✅ From defaults
  columnCount={10}                                    // 🔢 Fixed fill
  groupCount={isGrouped ? 10 : 0}                     // 🔢 Fixed fill
  propertyCount={Math.min(visiblePropertyCount, 4)}   // ✅ From properties
/>
```

### Future: Pass View Config via `defaults.skeleton`

To match `cardSize` and `withImage`, add to defaults:

```tsx
<DataViewProvider
  defaults={{
    limit: 10,
    skeleton: { cardSize: "large", withImage: true }
  }}
/>
```

---

## TableView

### View Props (`TableViewProps`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bulkActions` | `BulkAction<TData>[]` | - | Bulk action buttons |
| `onRowClick` | `(row: TData) => void` | - | Row click handler |
| `pagination` | `PaginationMode` | - | Pagination style |
| `showVerticalLines` | `boolean` | `true` | Show column dividers |
| `wrapAllColumns` | `boolean` | `true` | Wrap text in columns |

### Skeleton Props (`TableSkeletonProps`)

| Prop | Type | Default | Matches View Prop |
|------|------|---------|-------------------|
| `cellWidths` | `string[]` | `["auto"]` | ❌ Based on property widths |
| `columnCount` | `number` | `5` | ❌ Based on `propertyVisibility.length` |
| `rowCount` | `number` | `10` | ⚠️ Could use `defaults.limit` |
| `shrinkZero` | `boolean` | `false` | ❌ Internal layout detail |
| `withPagination` | `boolean` | `true` | ⚠️ Based on `pagination` prop |

### Current Hardcoded Values

```tsx
// Uses GroupSectionSkeleton for grouped mode (defaults: groupCount=10, expandedCount=0)
<GroupSectionSkeleton />
```

### What Could Be Passed Through

| Skeleton Prop | Source | Feasibility |
|---------------|--------|-------------|
| `columnCount` | `properties.filter(p => !p.hidden).length` | ✅ Known at render time |
| `rowCount` | `defaults.limit` | ✅ Known at render time |
| `withPagination` | `!!TableView.pagination` | ⚠️ Need to pass through |

---

## ListView

### View Props (`ListViewProps`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onItemClick` | `(item: TData) => void` | - | Item click handler |
| `pagination` | `PaginationMode` | - | Pagination style |

### Skeleton Props (`ListSkeletonProps`)

| Prop | Type | Default | Matches View Prop |
|------|------|---------|-------------------|
| `propertyCount` | `number` | `3` | ❌ Based on `propertyVisibility.length` |
| `rowCount` | `number` | `8` | ⚠️ Could use `defaults.limit` |
| `withDividers` | `boolean` | `true` | ❌ Hardcoded in view |
| `withPagination` | `boolean` | `true` | ⚠️ Based on `pagination` prop |

### Current Hardcoded Values

```tsx
// Uses GroupSectionSkeleton for grouped mode (defaults: groupCount=10, expandedCount=0)
<GroupSectionSkeleton />
```

### What Could Be Passed Through

| Skeleton Prop | Source | Feasibility |
|---------------|--------|-------------|
| `rowCount` | `defaults.limit` | ✅ Known at render time |
| `propertyCount` | `propertyVisibility.length` | ✅ Known at render time |
| `withPagination` | `!!ListView.pagination` | ⚠️ Need to pass through |

---

## GalleryView

### View Props (`GalleryViewProps`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cardPreview` | `string` | - | Property ID for card preview image |
| `cardSize` | `"small" \| "medium" \| "large"` | `"medium"` | Card size preset |
| `fitMedia` | `boolean` | `true` | Fit media to card |
| `onCardClick` | `(item: TData) => void` | - | Card click handler |
| `pagination` | `PaginationMode` | - | Pagination style |
| `showPropertyNames` | `boolean` | `false` | Show property names on cards |
| `wrapAllProperties` | `boolean` | `false` | Wrap text in properties |

### Skeleton Props (`GallerySkeletonProps`)

| Prop | Type | Default | Matches View Prop |
|------|------|---------|-------------------|
| `cardCount` | `number` | `6` | ⚠️ Could derive from `limit` + `cardSize` |
| `cardSize` | `"small" \| "medium" \| "large"` | `"medium"` | ✅ `cardSize` |
| `propertyCount` | `number` | `2` | ❌ Based on `propertyVisibility.length` |
| `withImage` | `boolean` | `true` | ✅ `!!cardPreview` |
| `withPagination` | `boolean` | `true` | ⚠️ Based on `pagination` prop |

### Current Hardcoded Values

```tsx
// Uses GroupSectionSkeleton for grouped mode (defaults: groupCount=10, expandedCount=0)
<GroupSectionSkeleton />
```

### What Could Be Passed Through

| Skeleton Prop | Source | Feasibility |
|---------------|--------|-------------|
| `cardSize` | `GalleryView.cardSize` | ⚠️ Need to pass through defaults |
| `withImage` | `!!GalleryView.cardPreview` | ⚠️ Need to pass through defaults |
| `cardCount` | `defaults.limit` | ✅ Known at render time |
| `withPagination` | `!!GalleryView.pagination` | ⚠️ Need to pass through |

---

## GroupSectionSkeleton (Shared)

Used at the outer layer (DataViewProvider) to show loading state for group counts query.
Inner content (per-group data) is handled by view components with their own skeletons.

### Skeleton Props (`GroupSectionSkeletonProps`)

| Prop | Type | Default | Source |
|------|------|---------|--------|
| `className` | `string` | - | Additional className |
| `groupCount` | `number` | `10` | 🔢 Fixed fill value |

### Usage

```tsx
<GroupSectionSkeleton />
<GroupSectionSkeleton groupCount={5} />
```

---

## Two-Layer Skeleton Architecture

Skeletons are rendered at two layers, each with different responsibilities:

```
DataViewProvider
  └── Suspense (Outer Layer - Group Query)
        └── QueryBridge
              └── GroupedLayout
                    └── For each group:
                          └── View Component (Inner Layer - Data Query)
                                └── TableView / ListView / GalleryView / BoardView
```

### Layer 1: Outer Layer (DataViewProvider)

**Responsibility**: Show skeleton while group counts query is loading.

| View Type | Skeleton | Props |
|-----------|----------|-------|
| Grouped Table/List/Gallery | `GroupSectionSkeleton` | `groupCount={10}` (fixed fill) |
| Board (flat or grouped) | `BoardSkeleton` | Uses config (see Board section) |

**Why**: DataViewProvider doesn't know which view will render, so it uses:
- Generic `GroupSectionSkeleton` for grouped non-board views
- `BoardSkeleton` for board (detected via `columnQueryOptionsFactory`)

### Layer 2: Inner Layer (View Components)

**Responsibility**: Show skeleton while per-group data query is loading.

Each view component:
1. Reads config from context (`limit`, `properties`, `propertyVisibility`)
2. Checks loading state (e.g., `isPlaceholderData`, `isFetching`)
3. Renders its own skeleton with appropriate config

| View | Skeleton | Config from Context |
|------|----------|---------------------|
| `TableView` | `TableSkeleton` | `rowCount={limit}`, `columnCount={propertyVisibility.length}` |
| `ListView` | `ListSkeleton` | `rowCount={limit}`, `propertyCount={propertyVisibility.length}` |
| `GalleryView` | `GallerySkeleton` | `cardCount={limit}`, `propertyCount={propertyVisibility.length}` |
| `BoardView` | (handled at outer layer) | - |

**Why**: View components know their own config (`cardSize`, `withImage`, etc.) and have access to context config.

---

## Implementation Plan

### Phase 1: Fix Outer Layer (DataViewProvider) ✅ DONE

**Simplified `GroupSectionSkeleton`**:
- Removed `children` prop (not needed - views handle inner skeletons)
- Removed `expandedCount` prop (not needed - two separate Suspense boundaries)
- `groupCount`: default **10** (fixed fill)

**Usage in DataViewProvider**:
```tsx
// Non-board grouped views
<GroupSectionSkeleton />
```

**Changes**:
- [x] Simplify `GroupSectionSkeleton` to only render group headers
- [x] Update default `groupCount` to 10
- [x] Remove `expandedCount` and `children` (separate Suspense handles inner layer)

### Phase 2: Inner Layer (View Components) ✅ DONE

Each view renders its own skeleton in Suspense fallback with access to context config.

**TableView**:
```tsx
<Suspense
  fallback={
    <TableSkeleton
      columnCount={displayProperties.length}  // ✅ From context
      rowCount={limit ?? 10}                   // ✅ From context
      withPagination={Boolean(pagination)}    // ✅ From view prop
    />
  }
>
```

**ListView**:
```tsx
<Suspense
  fallback={
    <ListSkeleton
      propertyCount={displayProperties.length}  // ✅ From context
      rowCount={limit ?? 10}                    // ✅ From context
      withPagination={Boolean(pagination)}     // ✅ From view prop
    />
  }
>
```

**GalleryView**:
```tsx
<Suspense
  fallback={
    <GallerySkeleton
      cardCount={limit ?? 10}                    // ✅ From context
      cardSize={cardSize}                        // ✅ From view prop
      propertyCount={displayProperties.length}   // ✅ From context
      withImage={Boolean(cardPreview)}           // ✅ From view prop
      withPagination={Boolean(pagination)}       // ✅ From view prop
    />
  }
>
```

**Changes**:
- [x] Add `limit` to context destructuring in `TableView`
- [x] Add `limit` to context destructuring in `ListView`
- [x] Add `limit` to context destructuring in `GalleryView`
- [x] Update `TableSkeleton` to use `limit` for `rowCount`
- [x] Update `ListSkeleton` to use `limit` for `rowCount` and `displayProperties.length` for `propertyCount`
- [x] Update `GallerySkeleton` to use `limit` for `cardCount`, `displayProperties.length` for `propertyCount`, and `cardPreview` for `withImage`

---

## Design Philosophy

| Category | Strategy | Example |
|----------|----------|---------|
| **Known config** | Use directly | `limit`, `properties.length` |
| **Query results** | Fixed fill value | `groupCount=10`, `columnCount=10` |
| **View config** | View handles own skeleton | `cardSize`, `withImage` |

### Why Views Handle Inner Skeletons

1. **Views know their config**: `cardSize`, `withImage`, `cardPreview` are props on the view
2. **Context access**: Views can read `limit`, `propertyVisibility` from context
3. **No detection needed**: DataViewProvider doesn't need to know which view is rendering
4. **Separation of concerns**: Outer layer = group structure, Inner layer = view-specific content

---

## Board Skeleton (Special Case)

Board is handled entirely at the outer layer because:
1. Board has both columns (horizontal) AND groups (vertical)
2. Board is detectable via `columnQueryOptionsFactory`
3. Board skeleton shows column headers + group accordion structure

| Skeleton Prop | Source | Value |
|---------------|--------|-------|
| `cardsPerColumn` | `defaults.limit` | Dynamic |
| `columnCount` | Fixed fill | `10` |
| `groupCount` | Fixed fill | `10` (when grouped) |
| `propertyCount` | `properties.filter(!hidden).length` | Dynamic (max 4) |
| `cardSize` | Default | `"medium"` |
| `withImage` | Default | `true` |
