# Filter Component Architecture (Implemented)

A clean, composable filter system following Notion's patterns. Based on the sort component architecture.

## Naming Convention

- **`simple-filter-*`** - Components for single filter rules (chips bar inline editing)
- **`advanced-filter-*`** - Components for nested AND/OR filter groups (full builder)

---

## Current File Structure

```
packages/dataview/src/
├── components/
│   ├── ui/toolbar/filter/           # Base UI (reusable)
│   │   │
│   │   ├── simple-filter-picker.tsx      # Property selection for adding filters
│   │   ├── simple-filter-editor.tsx      # Single rule editor (condition + value)
│   │   ├── filter-trigger.tsx            # Popover shell with variants
│   │   │
│   │   ├── advanced-filter-picker.tsx    # Property picker for changing rule property
│   │   ├── advanced-filter-editor.tsx    # Wrapper for FilterGroup
│   │   ├── advanced-filter-group.tsx     # Recursive AND/OR group
│   │   ├── advanced-filter-rule.tsx      # Single rule row in builder
│   │   ├── advanced-filter-actions.tsx   # Actions menu (remove, duplicate, wrap)
│   │   ├── advanced-filter-add-button.tsx # Add rule/group button
│   │   ├── advanced-filter-logic-picker.tsx # AND/OR toggle (Where/And/Or labels)
│   │   │
│   │   ├── condition-picker.tsx          # Operator dropdown (equals, contains, etc.)
│   │   │
│   │   └── properties/                   # Value inputs by property type
│   │       ├── checkbox-filter.tsx
│   │       ├── date-filter.tsx
│   │       ├── select-filter.tsx
│   │       ├── status-filter.tsx
│   │       ├── text-filter.tsx
│   │       ├── relative-date-picker.tsx
│   │       └── absolute-date-picker.tsx
│   │
│   └── toolbars/notion/             # Notion-specific composed components
│       ├── simple-filter-chip.tsx   # Simple filter chip (Property: value ▾)
│       ├── advanced-filter-chip.tsx # Advanced filter chip (N rules ▾)
│       ├── filter-tool.tsx          # Toolbar filter button
│       └── chips-bar.tsx            # Chips bar container
│
└── hooks/
    ├── use-filter-params.ts         # URL state management for filters
    ├── use-simple-filter-chip.ts    # Zustand store for chip popover state
    └── use-advance-filter-builder.ts # Zustand store for builder popover state
```

**Note:** No barrel file (`index.ts`) - use direct imports for each component.

---

## Component Mapping (Sort → Filter)

| Sort | Filter Simple | Filter Advanced |
|------|---------------|-----------------|
| `SortPicker` | `SimpleFilterPicker` | `SimpleFilterPicker` |
| `SortEditor` | `SimpleFilterEditor` | *(uses FilterRule)* |
| `SortBulkEditor` | - | `AdvancedFilterEditor` |
| `SortTrigger` | `FilterTrigger` | `FilterTrigger` |
| `SortChip` | `SimpleFilterChip` | `AdvancedFilterChip` |
| `SortTool` | `FilterTool` | `FilterTool` |

---

## Base UI Components

### SimpleFilterPicker
Property selection for adding filters.

```tsx
interface SimpleFilterPickerProps {
  properties: readonly PropertyMeta[];
  excludeIds?: string[];              // Already-used property IDs
  onSelect?: (property: PropertyMeta) => void;
  showAdvancedOption?: boolean;
  onAdvancedClick?: () => void;
}
```

### SimpleFilterEditor
Single filter rule editor with condition picker and value input.

```tsx
interface SimpleFilterEditorProps {
  rule: WhereRule;
  property: PropertyMeta;
  onRuleChange: (rule: WhereRule) => void;
  onRemove: () => void;
  onAddToAdvanced?: () => void;
}
```

### FilterTrigger
Popover shell with multiple variants.

```tsx
interface FilterTriggerProps {
  children: ReactNode;
  count?: number;
  variant?: "count" | "add" | "icon" | "chip";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

### AdvancedFilterPicker
Property picker for changing the property of an existing filter rule.

```tsx
interface AdvancedFilterPickerProps {
  properties: readonly PropertyMeta[];
  value?: PropertyMeta;
  onPropertyChange: (property: PropertyMeta) => void;
}
```

### AdvancedFilterEditor
Full filter builder with nested AND/OR groups.

```tsx
interface AdvancedFilterEditorProps {
  filter: WhereExpression;
  properties: readonly PropertyMeta[];
  onFilterChange: (filter: WhereNode | null) => void;
  onDeleteAll?: () => void;
}
```

---

## Notion-Specific Components

### FilterTool
Toolbar icon button that toggles chips bar or opens picker.

```tsx
interface FilterToolProps {
  properties: readonly PropertyMeta[];
  onToggle?: () => void;
}
```

### SimpleFilterChip
Chip for a single filter rule in the chips bar.

```tsx
interface SimpleFilterChipProps {
  rule: WhereRule;
  property: PropertyMeta;
  onRuleChange: (rule: WhereRule) => void;
  onRemove: () => void;
  onAddToAdvanced?: () => void;
  variant?: "compact" | "detailed";
}
```

### AdvancedFilterChip
Chip for advanced filter showing rule count.

```tsx
interface AdvancedFilterChipProps {
  filter: WhereExpression;
  properties: readonly PropertyMeta[];
  ruleCount: number;
  onFilterChange: (filter: WhereNode | null) => void;
}
```

---

## Hooks

### useFilterParams
URL state management with debouncing.

```tsx
const { filter, setFilter, clearFilter, resetFilter, isFiltered } = useFilterParams();
```

**Reset behavior:** `resetFilter()` clears local filter immediately for instant UI feedback, then allows the sync effect to restore server defaults after re-render.

### useSimpleFilterChip
Zustand store for managing which simple filter chip popover is open.

```tsx
const { openPropertyId, setOpen } = useSimpleFilterChip();
```

### useAdvanceFilterBuilder
Zustand store for managing advanced filter builder popover state.

```tsx
const { isOpen, setOpen } = useAdvanceFilterBuilder();
```

---

## Usage Examples

### Toolbar adds filter
```tsx
<FilterTool properties={properties} onToggle={toggleRow2} />
```

### ChipsBar shows simple filter
```tsx
{simpleFilterConditions.map(({ condition, index }) => (
  <SimpleFilterChip
    key={`filter-${condition.property}-${index}`}
    rule={condition}
    property={findProperty(condition.property)}
    onRuleChange={(rule) => handleRuleChange(index, rule)}
    onRemove={() => handleRuleRemove(index)}
    onAddToAdvanced={() => handleAddToAdvanced(index, condition)}
    variant="detailed"
  />
))}
```

### ChipsBar shows advanced filter
```tsx
{advancedFilter && (
  <AdvancedFilterChip
    filter={advancedFilter}
    properties={properties}
    ruleCount={ruleCount}
    onFilterChange={handleAdvancedFilterChange}
  />
)}
```

### Inline add filter button
```tsx
<FilterTrigger variant="add">
  <SimpleFilterPicker
    properties={properties}
    excludeIds={usedPropertyIds}
  />
</FilterTrigger>
```

---

## Bug Fixes

### Reset Button Not Clearing Filter Chips (Fixed)

**Issue:** When clicking reset, URL updated but filter chips remained visible. Sort chips cleared immediately.

**Root Cause:** In `useFilterParams.resetFilter()`, the code was:
```tsx
setLocalFilter(serverFilter);  // serverFilter had current filter values
isInternalChange.current = true;
setUrlFilterState(null);
```

The `serverFilter` came from context which included current URL filter values, so `setLocalFilter(serverFilter)` set the local state to the current filter (not clearing it). The `isInternalChange` flag then prevented the sync effect from updating after URL cleared.

**Fix:** Clear local filter immediately and allow sync effect to restore server defaults:
```tsx
setLocalFilter(null);  // Clear immediately
// Don't set isInternalChange - allow effect to sync to server defaults
setUrlFilterState(null);
```

Same fix applied to `useSortParams.resetSort()` for consistency.
