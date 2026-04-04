# Sticky Header Architecture Review

## The fundamental CSS constraint

`overflow-x: auto` implicitly sets `overflow-y: auto` (per CSS spec: if either axis is non-visible, the other becomes `auto`). This means any element with horizontal scrolling becomes a scroll container for **both** axes. `position: sticky` on children sticks relative to this container, not the outer page scroll.

Consequences:
- Putting `sticky` directly on a `<thead>` inside `overflow-x-auto` makes it stick relative to the table's scroll container, not the page
- If the table container doesn't overflow vertically (common when the page scrolls, not the container), `sticky` has no visible effect
- If we constrain the container height so it DOES overflow vertically, we get two vertical scrollbars (container + page) — bad UX
- For grouped views, each group's container would need its own height constraint, creating N vertical scrollbars

There is no CSS-only way to have horizontal scrolling (`overflow-x: auto`) without creating a vertical scroll container. `overflow-x: auto; overflow-y: visible` is explicitly not allowed by the spec.

## What we do instead

**Duplicate + visibility pattern** for table and board headers:

```
Page scroll container (window or SidebarInset)
  ├─ Sticky copy (height: 0; overflow: visible; position: sticky)
  │   └─ overflow-x-auto (hidden scrollbar, synced)
  │       └─ Duplicated header content
  ├─ overflow-clip
  │   └─ overflow-x-auto (visible scrollbar, synced)
  │       └─ Original header + body content
```

1. The sticky copy lives **outside** any `overflow-x-auto` container, so its `position: sticky` works against the page scroll
2. It has `height: 0` so it doesn't affect layout — the visible content overflows via `overflow: visible`
3. JS-based visibility check shows/hides the copy (only when original scrolls past threshold)
4. `useScrollSync` keeps horizontal scroll positions aligned across all `overflow-x-auto` containers
5. For table: ResizeObserver + debounced column width measurement keeps sticky copy aligned with original

**CSS-only sticky** for group headers (list, gallery, table groups, board groups):

Group headers don't need horizontal scrolling, so they sit outside `overflow-x-auto` and use plain `position: sticky; top: offset` directly. No duplication needed.

## Per-view breakdown

| View | Sticky element | Approach | Why |
|---|---|---|---|
| Table (ungrouped) | Column headers | Duplicate + visibility | Headers need horizontal scroll sync with table body |
| Table (grouped) | Column headers | Duplicate + visibility | Same as above, per-group |
| Table (grouped) | Group label | CSS sticky | No horizontal scroll needed |
| Board (flat) | Column headers | Duplicate + visibility | Headers need horizontal scroll sync with card columns |
| Board (grouped) | Column headers | Duplicate + visibility | Same, synced across all group containers |
| Board (grouped) | Group label | CSS sticky | No horizontal scroll needed |
| List (grouped) | Group label | CSS sticky | No horizontal scroll at all |
| Gallery (grouped) | Group label | CSS sticky | No horizontal scroll at all |

## Alternatives considered

### 1. `overflow: clip` instead of `overflow: auto`

`overflow: clip` clips overflow without creating a scroll container, so `position: sticky` would work inside it. But `clip` provides no scrolling — users can't scroll horizontally. We'd need to implement horizontal scrolling via JS (translateX), losing native scrollbar behavior, touch/trackpad physics, and accessibility.

**Verdict:** More complex, worse UX.

### 2. Contained scroll (single `overflow: auto` for both axes)

Make the view a fixed-height box with `overflow: auto`. Both horizontal and vertical scroll happen on the same container, so `position: sticky` works in both axes. Used by Trello, Linear, Jira.

**Verdict:** Works but changes the page scroll model. The dataview currently fills the page and uses page-level vertical scroll. Switching to contained scroll means the toolbar/tabs are pinned outside, only the view content scrolls. This is a deliberate UX choice we decided against to keep consistency across table/list/gallery/board.

### 3. Portal + `position: fixed` (the old approach)

The approach before this refactor. Each sticky header was portaled to `document.body` with `position: fixed; top: offset; left: computed; width: computed`.

**Verdict:** Works but fragile. Left/width must be computed via JS and updated on every resize/scroll. During sidebar expand/collapse animations, the values lag behind, causing visible jitter. Also mixes viewport-relative and scroll-container-relative coordinate systems, making offset composition error-prone.

### 4. Intersection Observer for visibility instead of scroll listener

Replace the `getBoundingClientRect` check on scroll with an IntersectionObserver on the original header. When the original header leaves the viewport, show the sticky copy.

**Verdict:** Slightly cleaner but introduces threshold edge cases (rootMargin calculation to account for offset). The current approach is simple, synchronous, and handles the offset math inline. Not a significant improvement.

### 5. Single scroll container per view (no per-group overflow-x in board)

Keep a single `overflow-x-auto` for the entire board content, and handle group headers differently (e.g., render them outside via absolute positioning or a separate layer).

**Verdict:** Reduces the number of synced containers but requires complex positioning for group headers. The per-group approach is simpler to reason about and the scroll sync overhead is minimal (only expanded groups participate, and scroll events are passive).

## Assessment

The current duplicate + visibility approach is the best available solution given the CSS constraint. It:

- Avoids multiple vertical scrollbars (the user's primary concern)
- Keeps page-level vertical scroll for all views
- Uses native `position: sticky` (no viewport math for vertical positioning)
- Uses native horizontal scrolling (real scrollbars, touch physics)
- Has consistent offset semantics across all components
- Handles sidebar resize automatically (sticky elements follow their parent's width)

The main cost is implementation complexity (duplicate content, scroll sync, visibility detection). But this complexity is well-encapsulated:
- `useScrollSync` handles all horizontal sync
- `useScrollParent` handles scroll container detection
- The visibility pattern is consistent between `DataTableStickyHeader` and `StickyColumnLabel`
- `StickyGroupLabel` is a one-liner for the simple CSS-only case

No changes recommended. The architecture is sound for the constraints.
