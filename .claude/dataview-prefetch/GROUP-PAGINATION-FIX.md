# Group Pagination - No Data Loading Issue

## Problem

`/group-pagination` page shows no data on initial load.

## Root Cause

1. **Default `expanded` is `[]`** (empty array)
2. When `expanded` is empty, client fetches no group items
3. `allItems = expandedData.flatMap(...)` results in empty array
4. TableView with `view.group` uses **client-side grouping** from `useGroupConfig`
5. Client-side grouping only groups items that exist in `data` - it cannot display groups with 0 items
6. Result: Nothing renders

## Flow Diagram

```
URL: /group-pagination (no ?expanded param)
     ↓
expanded = []  (default)
     ↓
Server prefetches:
  - groupCounts ✓
  - expanded groups: NONE (empty loop)
     ↓
Client queries:
  - groupCounts ✓ (has data like {Electronics: 50, Clothing: 30})
  - expanded groups: NONE (empty map)
     ↓
allItems = []  (empty!)
     ↓
TableView receives data=[] with view.group config
     ↓
useGroupConfig groups empty array → no groups to display
     ↓
Nothing renders (or empty state)
```

## The Core Issue

The **new pattern** decoupled data fetching from the view:
- Only fetch items for expanded groups
- Pass combined items to DataViewProvider
- Let view do client-side grouping

But **client-side grouping needs items to exist** to create groups. It can't show collapsed groups with just counts.

The **old pattern** used `pagination.groups` which contained:
- ALL groups (from counts)
- Items only for expanded groups
- TableView could render all group headers (even collapsed ones with 0 items)

---

## Options

### Option A: Add Default Expanded Group

**Approach:** Always expand first group by default

**Server (page.tsx):**
```tsx
const params = groupSearchParams.parse(await searchParams);
let { expanded, limit } = params;

// Get first group if none expanded
if (expanded.length === 0) {
  // Need to query group counts FIRST (blocking)
  const groupCounts = await queryClient.fetchQuery(
    trpc.product.getGroup.queryOptions({ groupBy: GROUP_BY })
  );
  const firstGroup = Object.keys(groupCounts)[0];
  if (firstGroup) {
    expanded = [firstGroup];
  }
}
```

**Pros:**
- Simple to implement
- Always shows data on initial load

**Cons:**
- Requires blocking fetch on server (can't use `void`)
- User can't have "all collapsed" view
- First group chosen arbitrarily

---

### Option B: Build Group Structure from Counts (Client-Side)

**Approach:** Client builds groups from `groupCounts`, only populates items for expanded

**Client component:**
```tsx
// Build all groups from counts
const allGroups = Object.entries(groupCounts ?? {}).map(([key, info]) => {
  const expandedGroup = expandedData.find(g => g.groupKey === key);
  return {
    key,
    count: info.count,
    items: expandedGroup?.items ?? [],
    isExpanded: expanded.includes(key),
  };
});

// Pass structured groups to provider (need new prop)
<DataViewProvider
  data={allItems}
  properties={productProperties}
  groups={allGroups}  // NEW PROP
>
```

**Pros:**
- Shows all groups (expanded or not)
- No blocking server fetch
- User can collapse all groups

**Cons:**
- Requires changes to DataViewProvider and TableView
- More complex implementation

---

### Option C: Return to Server Pagination Pattern (Recommended)

**Approach:** Bring back `pagination` prop with `groups` array

This was the original pattern that worked. The key insight:
- `pagination.groups` provides **all groups** with their metadata
- TableView reads this to render group headers
- Items are only present for expanded groups

**Changes needed:**

1. **Client component builds pagination object:**
```tsx
const allGroups = Object.entries(groupCounts ?? {}).map(([key, info]) => {
  const expandedGroup = expandedData.find(g => g.groupKey === key);
  return {
    key,
    value: key,
    count: info.count,
    hasMore: info.hasMore,
    items: expandedGroup?.items ?? [],
    // Pagination controls per group (if needed)
    hasNext: false,
    hasPrev: false,
    onNext: () => {},
    onPrev: () => {},
  };
});

const pagination = {
  groups: allGroups,
  limit,
  onLimitChange: (newLimit) => setLimit(newLimit),
};

<DataViewProvider
  data={allItems}
  properties={productProperties}
  pagination={pagination}
>
```

**Pros:**
- Uses existing TableView logic (no view changes)
- Shows all groups with counts
- Works with existing `hasGroupedPagination` check in TableView

**Cons:**
- More code in client component
- Need to build pagination object manually

---

### Option D: Hybrid - Show Groups from Counts, Fetch on Expand

**Approach:** Always show all group headers from counts, lazy-load items on expand

This is essentially Option C but with cleaner separation.

---

## Recommendation

**Option C (Return to Server Pagination Pattern)** is recommended because:

1. **Minimal changes** - TableView already supports this
2. **Proven pattern** - It worked before the refactor
3. **Better UX** - Shows all groups with counts, user can expand/collapse freely
4. **Server prefetch still works** - Just need to build the pagination object client-side

## Implementation Plan

1. Update client components to build `pagination` object from `groupCounts` + `expandedData`
2. Pass `pagination` to DataViewProvider
3. Keep the current prefetch pattern (server prefetches counts + expanded groups)
4. TableView will use `contextPagination.groups` to render all groups

---

## ✅ IMPLEMENTED

**Solution Applied:** Option C - Build `pagination` object client-side from `groupCounts` + `expandedData`

**Files Modified:**
- `apps/web/src/modules/group-pagination/product-group-pagination-table.tsx`
- `apps/web/src/modules/group-pagination/product-group-pagination-list.tsx`
- `apps/web/src/modules/group-pagination/product-group-pagination-gallery.tsx`

**Key Changes:**
```tsx
// Build pagination object with all groups from groupCounts
const pagination = useMemo<GroupedPaginationOutput<Product>>(() => {
  const groups = Object.entries(groupCounts ?? {}).map(([key, info]) => {
    const expandedGroup = expandedData.find((g) => g.groupKey === key);
    return {
      key,
      value: key,
      count: info.count,
      hasMore: info.hasMore,
      displayCount: info.hasMore ? "99+" : String(info.count),
      isLoading: false,
      items: expandedGroup?.items ?? [],
      hasNext: false,
      hasPrev: false,
      onNext: () => {},
      onPrev: () => {},
    };
  });

  return {
    items: allItems,
    limit,
    isLoading: false,
    groups,
    onLimitChange: () => {},
  };
}, [groupCounts, expandedData, allItems, limit]);

// Pass to DataViewProvider
<DataViewProvider data={allItems} properties={productProperties} pagination={pagination}>
```

**Result:** When `expanded = []`, all groups now display in collapsed form with their counts. Users can click to expand any group, which triggers a URL change and server prefetch.
