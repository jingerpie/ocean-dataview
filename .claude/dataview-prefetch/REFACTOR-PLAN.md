# DataView Prefetch Refactor Plan

## Overview

Refactor dataview usage from internal-fetch pattern to URL-driven prefetch pattern.

**Current:** Hooks read URL state and fetch internally
**Target:** Server prefetches, client receives props and queries with props

**Status: COMPLETED** (Phases 1-5 done, Phase 6 partial - old hooks kept for backward compatibility)

---

## Phase 1: Create New Hooks (URL Setters Only) ✅

### 1.1 Create `usePaginationControls` hook ✅
- [x] Create file: `packages/dataview/src/lib/data-views/hooks/use-pagination-controls.ts`
- [x] Implement: Accept `limit`, `start`, `hasNext`, `hasPrev`, `endCursor`, `startCursor`
- [x] Implement: Return `pagination` object with `onNext`, `onPrev`, `onLimitChange`
- [x] Use `shallow: false` for all URL updates
- [x] Export from `hooks/index.ts`

### 1.2 Create `useGroupControls` hook ✅
- [x] Create file: `packages/dataview/src/lib/data-views/hooks/use-group-controls.ts`
- [x] Implement: Accept `expanded` array
- [x] Implement: Return `toggleGroup`, `expandAll`, `collapseAll`
- [x] Use `shallow: false` for all URL updates
- [x] Export from `hooks/index.ts`

### 1.3 Create `useSubgroupControls` hook ✅
- [x] Create file: `packages/dataview/src/lib/data-views/hooks/use-subgroup-controls.ts`
- [x] Implement: Accept `expanded`, `expandedSubgroups` arrays
- [x] Implement: Return `toggleGroup`, `toggleSubgroup`
- [x] Handle cleanup when group collapses (remove related subgroups)
- [x] Export from `hooks/index.ts`

---

## Phase 2: Create Search Params Types ✅

### 2.1 Create flat pagination search params ✅
- [x] Create file: `packages/shared/src/types/pagination-search-params.ts`
- [x] Define: `after`, `before`, `limit`, `start` parsers
- [x] Use `createSearchParamsCache` from `nuqs/server`
- [x] Export type and parser

### 2.2 Create grouped pagination search params ✅
- [x] Create file: `packages/shared/src/types/group-search-params.ts`
- [x] Define: `expanded`, `limit`, `groupBy` parsers
- [x] Handle `expanded` as array of strings
- [x] Export type and parser

### 2.3 Create subgroup pagination search params ✅
- [x] Create file: `packages/shared/src/types/subgroup-search-params.ts`
- [x] Define: `expanded`, `expandedSubgroups`, `limit`, `groupBy`, `subGroupBy` parsers
- [x] Handle subgroup format: `"groupValue:subgroupValue"`
- [x] Export type and parser

### 2.4 Export all from shared package ✅
- [x] Update `packages/shared/src/types/index.ts` to export new types

---

## Phase 3: Refactor `/pagination` Page ✅

### 3.1 Update `apps/web/src/app/pagination/page.tsx` ✅
- [x] Make async server component
- [x] Import and use `paginationSearchParams.parse()`
- [x] Get `queryClient` from `getQueryClient()`
- [x] Prefetch `trpc.product.getMany.queryOptions({ after, before, limit, sort })`
- [x] Wrap with `HydrationBoundary`
- [x] Pass `after`, `before`, `limit`, `start` as props to each tab component

### 3.2 Refactor `product-pagination-table.tsx` ✅
- [x] Add props interface: `after`, `before`, `limit`, `start`
- [x] Replace `usePagination` with `useSuspenseQuery` + `usePaginationControls`
- [x] Query with props (matches server prefetch)
- [x] Keep `DataViewProvider` wrapper
- [x] Keep `TableView` and `PagePagination` unchanged

### 3.3 Refactor `product-pagination-list.tsx` ✅
- [x] Add props interface: `after`, `before`, `limit`, `start`
- [x] Replace `usePagination` with `useSuspenseQuery` + `usePaginationControls`
- [x] Keep `DataViewProvider` wrapper
- [x] Keep `ListView` and `PagePagination` unchanged

### 3.4 Refactor `product-pagination-gallery.tsx` ✅
- [x] Add props interface: `after`, `before`, `limit`, `start`
- [x] Replace `usePagination` with `useSuspenseQuery` + `usePaginationControls`
- [x] Keep `DataViewProvider` wrapper
- [x] Keep `GalleryView` and `PagePagination` unchanged

### 3.5 Refactor `product-group-pagination-board.tsx` (SKIPPED)
- Board view kept as-is (always shows all columns, different pattern)

---

## Phase 4: Refactor `/group-pagination` Page ✅

### 4.1 Update `apps/web/src/app/group-pagination/page.tsx` ✅
- [x] Already async server component - verify
- [x] Update to use `groupSearchParams.parse()`
- [x] Loop prefetch ALL expanded groups (not just first)
- [x] Pass `expanded`, `limit`, `groupBy` as props to each tab component

### 4.2 Refactor `product-group-pagination-table.tsx` ✅
- [x] Add props interface: `expanded`, `limit`, `groupBy`
- [x] Remove `useGroupExpansion` and `useGroupPagination`
- [x] Use `useSuspenseQuery` for group counts
- [x] Loop `useSuspenseQuery` for each expanded group
- [x] Use `useGroupControls` for `toggleGroup`
- [x] Keep `DataViewProvider` and `TableView` with group config

### 4.3 Refactor `product-group-pagination-list.tsx` ✅
- [x] Add props interface: `expanded`, `limit`, `groupBy`
- [x] Same pattern as table
- [x] Keep `ListView` with group config

### 4.4 Refactor `product-group-pagination-gallery.tsx` ✅
- [x] Add props interface: `expanded`, `limit`, `groupBy`
- [x] Same pattern as table
- [x] Keep `GalleryView` with group config

### 4.5 Refactor `product-sub-group-pagination-board.tsx` (SKIPPED)
- Board view kept as-is (always shows all columns, different pattern)

---

## Phase 5: Update View Components (If Needed) ✅

### 5.1 Review TableView group prop interface ✅
- [x] Verify `group.expandedGroups` and `group.onExpandedChange` work with new pattern
- [x] No updates needed - existing interface works

### 5.2 Review ListView group prop interface ✅
- [x] Same verification as TableView - works

### 5.3 Review GalleryView group prop interface ✅
- [x] Same verification as TableView - works

### 5.4 Review BoardView group/subGroup prop interface (SKIPPED)
- Board views kept as-is for now

---

## Phase 6: Cleanup (PARTIAL)

### 6.1 Old hooks kept for backward compatibility
- Old hooks (`usePagination`, `useGroupPagination`, `useGroupExpansion`) kept
- New hooks added alongside for new pattern
- Can be deprecated/removed in future

### 6.2 Update documentation
- [x] Usage examples in `.claude/dataview-prefetch/` folder (01-08 files)
- [ ] Update README if needed

### 6.3 Run tests and verify ✅
- [x] Run `bun run check-types` - no type errors
- [x] Run `bun run check` - lint passed
- [ ] Manual test `/pagination` page - all views work
- [ ] Manual test `/group-pagination` page - all views work
- [ ] Verify no skeleton flash on navigation
- [ ] Verify URL state works correctly

---

## File Change Summary

### New Files
```
packages/dataview/src/lib/data-views/hooks/
├── use-pagination-controls.ts   # NEW ✅
├── use-group-controls.ts        # NEW ✅
└── use-subgroup-controls.ts     # NEW ✅

packages/shared/src/types/
├── pagination-search-params.ts  # NEW ✅
├── group-search-params.ts       # NEW ✅
└── subgroup-search-params.ts    # NEW ✅
```

### Modified Files
```
packages/dataview/src/lib/data-views/hooks/index.ts  # Add new exports ✅
packages/shared/src/types/index.ts                   # Add new exports ✅

apps/web/src/app/pagination/page.tsx                 # Add prefetch ✅
apps/web/src/app/group-pagination/page.tsx           # Update prefetch loop ✅

apps/web/src/modules/pagination/
├── product-pagination-table.tsx    # Refactor to props ✅
├── product-pagination-list.tsx     # Refactor to props ✅
├── product-pagination-gallery.tsx  # Refactor to props ✅
└── product-group-pagination-board.tsx  # KEPT AS-IS

apps/web/src/modules/group-pagination/
├── product-group-pagination-table.tsx    # Refactor to props ✅
├── product-group-pagination-list.tsx     # Refactor to props ✅
├── product-group-pagination-gallery.tsx  # Refactor to props ✅
└── product-sub-group-pagination-board.tsx  # KEPT AS-IS
```

### Files Kept (Not Removed)
```
packages/dataview/src/lib/data-views/hooks/
├── use-pagination.ts        # KEPT (backward compat)
├── use-group-pagination.ts  # KEPT (backward compat)
└── use-group-expansion.ts   # KEPT (backward compat)
```

---

## Verification Checklist

### Flat Pagination (`/pagination`)
- [ ] Initial load - no skeleton (data prefetched)
- [ ] Click "Next" - no skeleton (server prefetches new page)
- [ ] Click "Prev" - no skeleton
- [ ] Change limit - no skeleton
- [ ] Refresh on page 2 - no skeleton
- [ ] Switch tabs (table/list/gallery/board) - works correctly
- [ ] URL reflects current state

### Grouped Pagination (`/group-pagination`)
- [ ] Initial load - no skeleton
- [ ] Expand group - no skeleton (server prefetches)
- [ ] Collapse group - works correctly
- [ ] Expand multiple groups - no skeleton
- [ ] Refresh with expanded groups - no skeleton
- [ ] Switch tabs - works correctly
- [ ] URL reflects expanded state

### Board with Subgroups
- Board views kept as-is (different pattern - always show all columns)
