# Sticky Header Consistency

## Problem

Three sticky header components with a shared `offset` prop but a coordinate system mismatch:

| Component | Strategy | `offset` means |
|---|---|---|
| DataTableStickyHeader | `position: fixed` + portal | px from **viewport** top |
| StickyColumnLabel | `position: fixed` + portal | px from **viewport** top |
| StickyGroupLabel | `position: fixed` + portal | px from **viewport** top |

All three currently use `position: fixed` + portal to `document.body`, so offsets compose correctly:

- **Non-grouped table:** `DataTableStickyHeader` at `offset` (57)
- **Grouped table:** `StickyGroupLabel` at `offset` (57), `DataTableStickyHeader` at `offset + 44` (101)
- **Non-grouped board:** `StickyColumnLabel` at `offset` (57)
- **Grouped board:** `StickyColumnLabel` at `offset` (57), `StickyGroupLabel` at `offset + 36` (93)

This two-mode offset composition (base vs base + header height) is the core design. Any fix must preserve it.

### Issues with current portal/fixed approach

1. **Hardcoded `?? 57` fallback** in `group-section.tsx` — should use the offset from props
2. **Sidebar animation lag** — portal-based headers compute `left`/`width` via JS. During sidebar expand/collapse, these values are stale until the next ResizeObserver callback, causing visible jitter
3. **Viewport math** — each component manually calculates `left`, `width`, and clips to `window.innerWidth`

## Options

### Option A — Pop stash: CSS sticky with board view fix

The stashed changes converted all three components to `position: sticky`. This works for table, list, and gallery but breaks the board view.

**Why the board breaks:** The board wraps all content in `overflow-x-auto` for horizontal scrolling. CSS spec: setting `overflow-x: auto` implicitly sets `overflow-y: auto`, creating a scroll container. `position: sticky` elements inside it stick relative to this container (which has no vertical overflow), so vertical sticking has no effect. Confirmed via browser inspection — the board's `overflow-x-auto pb-4` div computes to `overflowY: auto`.

**Why other views work:** In table/list/gallery, sticky elements sit outside any `overflow-x-auto` ancestor. Their entire parent chain is `overflow: visible` up to the viewport.

#### Board column headers fix

Move `StickyColumnLabel` **outside** the `overflow-x-auto` container as a sibling above it. The component already has its own inner `overflow-x-auto` for horizontal scroll sync. This matches how `DataTableStickyHeader` relates to the table's overflow wrapper.

```
<div class="relative max-w-full">
  <StickyColumnLabel />                       ← outside overflow-x, sticky works
  <div class="overflow-clip">
    <div class="overflow-x-auto" ref={scrollContainer}>
      <OriginalColumnHeaders ref={headerRef} />
      <Accordion>...</Accordion>
    </div>
  </div>
</div>
```

Requires splitting `BoardColumnHeaders` so `StickyColumnLabel` and the original header render at different DOM levels.

#### Board group headers fix

Group headers are inside the Accordion, inside `overflow-x-auto`. Two sub-options:

**A1 — Contained scroll (recommended for boards)**

Wrap the board in a single `overflow: auto` container with a constrained height. Both horizontal and vertical scroll happen on the same element, so `position: sticky` works in both axes.

```
<div class="overflow-auto" style="max-height: calc(100vh - toolbarHeight)">
  <div class="min-w-fit">
    <StickyColumnLabel />        ← sticky top + height:0 trick
    <OriginalColumnHeaders />
    <Accordion>
      <StickyGroupLabel />       ← sticky top, sticky left-0
      <BoardColumns />
    </Accordion>
  </div>
</div>
```

This changes the board from page-scroll to contained-scroll (like Trello/Linear/Jira boards). Natural UX for a 2D scroll area. Other views (table/list/gallery) keep page-scroll.

The `offset` in this model is relative to the board container, so it would be `0` (column headers at container top). Group header offset would be `0 + columnHeaderHeight`. The consumer's base offset (57 for navbar) is handled by the container's position in the page, not by the sticky offset.

**A2 — Horizontal-only sticky for group headers**

Keep group headers inside `overflow-x-auto` with `sticky left-0` (horizontal). Accept no vertical sticking for board group headers. Simplest, but loses vertical sticky for groups.

#### Summary of stashed changes to keep vs rework

| File | Status |
|---|---|
| `sticky-group-label.tsx` | Keep CSS-sticky rewrite (works for table/list/gallery) |
| `data-table-sticky-header.tsx` | Keep CSS-sticky rewrite |
| `sticky-column-label.tsx` | Rework: needs to render outside `overflow-x-auto` |
| `board-view/index.tsx` | Rework: restructure DOM for contained scroll (A1) or split header rendering |
| `board-column-headers.tsx` | Rework: split StickyColumnLabel from original headers |
| `group-section.tsx` | Keep removal of `?? 57` fallback |
| `gallery-view/index.tsx` | Keep: stickyHeader prop pass-through |
| `list-view/index.tsx` | Keep: stickyHeader prop pass-through |
| Consumer files | Keep, but board offset changes to `0` if using contained scroll |

#### Offset semantics under Option A

With CSS sticky, `offset` means "px from scroll container top."

- **Table/list/gallery (page scroll):** scroll container is viewport → `offset: 57` means 57px from viewport top (same as before)
- **Board with contained scroll (A1):** scroll container is the board div → `offset: 0` for column headers, `offset: columnHeaderHeight` for group headers. Navbar offset is implicit (container sits below navbar)
- **Board without contained scroll (A2):** same as table/list/gallery

Two-mode composition still works:
- Non-grouped: data header at `offset`
- Grouped: group header at `offset`, data header at `offset + groupHeaderHeight`

### Option B — Stay on portal/fixed, fix secondary issues

Keep the current approach. Fix the specific problems without changing positioning strategy.

#### Changes

1. **Remove `?? 57` hardcode** in `group-section.tsx` — use `stickyHeader.offset` directly (default 0)
2. **Fix sidebar animation lag** — in each portal component, add immediate `handleScrollLogic()` call inside `ResizeObserver` callback (before the debounced handler). This repositions `left`/`width` on every frame during resize, not just after debounce settles
3. **Add `stickyHeader` prop** to `ListView` and `GalleryView` (currently hardcoded `offset: 57` inside the view)

#### Tradeoff

Less risky. No DOM restructuring. But portal/fixed is inherently more fragile — viewport math, z-index stacking with other portals, and any future layout changes (e.g., moving to SidebarInset scroll) would require updating all three components.

## Recommendation

**Option A with sub-option A1** (contained scroll for board). Reasons:

1. CSS sticky eliminates the entire class of portal positioning bugs (sidebar lag, viewport math, stacking context)
2. Contained scroll is the natural UX for a 2D-scrolling board view
3. The stashed changes already work for 3 of 4 views — only the board needs additional work
4. The two-mode offset composition is preserved

If the contained-scroll UX change for boards is undesirable, fall back to **A2** (horizontal-only sticky for board group headers) as a simpler starting point.
