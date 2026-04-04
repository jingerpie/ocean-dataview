# Refactor Property Display Controls

## Context

Two issues with the dataview property system:

1. **Terminology**: The property field is `label` but `showPropertyNames` uses "name". Since `showPropertyNames` and `wrapAllProperties` are Notion-aligned terms we want to keep, the fix is renaming `property.label` → `property.name` across the package.

2. **Granularity**: `showPropertyNames` and `wrapAllProperties` are global all-or-nothing toggles. We need per-property overrides so individual properties can opt in/out.

## Approach

### Part A: Rename `label` → `name` on all display name fields

Rename every `label` field that represents a display name:
- `BaseProperty.label` → `name`
- `PropertyMeta.label` → `name`
- `StatusGroup.label` → `name`
- `ButtonAction.label` → `name`
- `BulkAction.label` → `name`

DO NOT rename Config/UI `{ label, value }` pairs (picker options, conditions, chart legends).

**Scope**: ~25 property reads across 14 dataview files + ~10 StatusGroup/ButtonAction/BulkAction reads + 4 consumer property files.

### Part B: Add per-property overrides

Add `showName?: boolean` and `wrap?: boolean` to `BaseProperty` and `PropertyMeta`. Resolution in DataCard:
```ts
const resolvedShowName = property.showName ?? showPropertyNames;
const resolvedWrap = property.wrap ?? wrapAllProperties;
```

## Files to modify

### 1. `packages/dataview/src/types/property.type.ts`
- Rename `label?: string` → `name?: string` in `BaseProperty` and `PropertyMeta`
- Rename `label: string` → `name: string` in `StatusGroup` (line 135)
- Rename `label: string` → `name: string` in `ButtonAction` (line 179)
- Add `showName?: boolean` and `wrap?: boolean` to `BaseProperty` and `PropertyMeta`
- Update JSDoc comments
- `toPropertyMeta` uses rest spread — new fields carry through automatically

### 1b. `packages/dataview/src/types/action.type.ts`
- Rename `label: string` → `name: string` in `BulkAction`

### 2. `packages/dataview/src/components/views/data-card.tsx`
- Update `property.label` → `property.name` (line 139)
- Add per-property resolution logic in `displayProperties.map`:
  ```ts
  const resolvedShowName = property.showName ?? showPropertyNames;
  const resolvedWrap = property.wrap ?? wrapAllProperties;
  ```

### 3. Dataview component files — `.label` → `.name` (~17 files)

**property.label → property.name:**
- `components/ui/filter/advanced-filter-picker.tsx` (4 occurrences)
- `components/ui/filter/filter-bulk-editor.tsx` (2)
- `components/ui/filter/simple-filter-editor.tsx` (1)
- `components/ui/filter/simple-filter-picker.tsx` (2)
- `components/ui/group/group-editor.tsx` (1)
- `components/ui/sort/sort-editor.tsx` (1)
- `components/ui/sort/sort-picker.tsx` (2)
- `components/toolbars/notion/simple-filter-chip.tsx` (1)
- `components/toolbars/notion/settings-tool/settings-visibility.tsx` (2)
- `components/toolbars/notion/toolbar.tsx` (2)
- `components/views/table-view/index.tsx` (1 property.label)
- `hooks/use-chart-transform.ts` (4)
- `utils/compute-data.ts` (1 property.label + 1 group.label)

**group.label → group.name (StatusGroup):**
- `components/ui/filter/properties/status-filter.tsx` (4: group.label refs)
- `utils/compute-data.ts` (1: group.label)

**action.label → action.name (ButtonAction):**
- `components/ui/properties/button-property.tsx` (3: destructure + usage)

**action.label → action.name (BulkAction):**
- `components/views/table-view/index.tsx` (3: action.label refs)
- `components/views/table-view/table-skeleton.tsx` (check for any refs)

### 4. Consumer property definition files — `label:` → `name:`
- `apps/app/src/modules/listing/listing-properties.tsx` (12 property-level + 3 StatusGroup)
- `apps/app/src/modules/channel/channel-properties.tsx` (10)
- `apps/app/src/modules/marketplace/marketplace-properties.tsx` (4)
- `apps/app/src/modules/order/order-properties.tsx` (13)

### DO NOT rename
- Config/UI `{ label, value }` pairs — picker options, conditions, chart legends (these are option descriptors, not display names)

## Not needed

- No changes to `showPropertyNames` / `wrapAllProperties` prop names — keeping Notion terms
- No utility function for resolution — one-liner in DataCard
- No deprecation shim — internal package

## Verification

1. `bun x ultracite check` — lint clean
2. `bun x tsc --noEmit` — type-check catches any missed renames
3. Browse gallery — property names render correctly
4. Test per-property override: set `showName: false` on one property with `showPropertyNames` on — confirm only that property's name is hidden
