# Sort Component Architecture

A clean, composable sort system following Notion's patterns.

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         Notion Toolbar                          │
├─────────────────────────────────────────────────────────────────┤
│  SortTool (icon)          │  ChipsBar                          │
│  └─ Opens picker when     │  └─ SortChip (when sorts exist)    │
│     no sorts exist        │     └─ SortTrigger + SortBulkEditor│
└─────────────────────────────────────────────────────────────────┘
```

## Base UI Components (`/components/ui/toolbar/sort/`)

These are pure, reusable UI components without business logic.

### SortPicker
Property selection for adding sorts.

```tsx
interface SortPickerProps {
  properties: readonly PropertyMeta[];
  addSort?: (prop: string, direction?: "asc" | "desc") => void;
  onSelect?: (property: PropertyMeta) => void;
}
```

**Features:**
- Searchable Command-based list
- Filters out formula/button properties (can't sort)
- Excludes already-used properties
- Sorted alphabetically by label
- Uses `useSortParams()` internally, or accepts `addSort` from parent

**Why `addSort` prop?**
When `SortPicker` is inside a popover, the popover may close (unmount) before the debounced URL update fires. By passing `addSort` from a persistent parent component, the debounced callback survives the unmount.

### SortEditor
Editor for a single sort rule.

```tsx
interface SortEditorProps {
  sort: SortQuery;
  property: PropertyMeta;
  properties: readonly PropertyMeta[];
  onUpdate: (updates: Partial<SortQuery>) => void;
  onRemove: () => void;
  draggable?: boolean;
}
```

**Features:**
- Drag handle (via @dnd-kit/sortable)
- Property dropdown (change which field to sort)
- Direction dropdown (Ascending/Descending)
- Remove button

### SortBulkEditor
Manages all sort rules with DnD reordering.

```tsx
interface SortBulkEditorProps {
  properties: readonly PropertyMeta[];
  onSortsChange?: (sorts: SortQuery[]) => void;
  onDeleteAll?: () => void;
}
```

**Features:**
- List of `SortEditor` components
- Drag-and-drop reordering (via @dnd-kit)
- "Add sort" button with embedded `SortPicker`
- "Delete sort" button (clears all)
- Uses `useSortParams()` internally

### SortTrigger
Popover shell with multiple variants.

```tsx
interface SortTriggerProps {
  children: ReactNode;
  count?: number;
  variant?: "count" | "add" | "icon";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

**Variants:**
- `count` - `[↕ N sorts ▾]` - use in chips bar
- `add` - `[+ Sort]` - add button style
- `icon` - `[↕]` - compact toolbar icon

**Composable Design:**
Pass any content as children: `SortPicker`, `SortEditor`, or `SortBulkEditor`.

## Notion-Specific Components (`/components/toolbars/notion/`)

These compose base UI with hooks and business logic.

### SortTool
Toolbar icon button.

```tsx
interface SortToolProps {
  properties: readonly PropertyMeta[];
  onToggle?: () => void;
}
```

**Behavior:**
- If sorts exist → clicking calls `onToggle` (toggle chips bar visibility)
- If no sorts → clicking opens picker to add first sort, then opens bulk editor

### SortChip
Chips bar component showing sort count.

```tsx
interface SortChipProps {
  properties: readonly PropertyMeta[];
}
```

**Behavior:**
- Always shows `SortBulkEditor` (only rendered when sorts exist)
- Uses `useSortBuilder()` for shared popover state
- Closes popover when all sorts deleted

## State Management

### useSortParams Hook
Central hook for sort state with debounced URL updates.

```tsx
const {
  sort,       // Current sort rules (SortQuery[])
  setSort,    // Replace all sorts
  addSort,    // Add or toggle sort
  removeSort, // Remove specific sort
  clearSort,  // Clear all (immediate URL update)
  resetSort,  // Reset to server defaults
  isSorted,   // Boolean: has sorts?
} = useSortParams();
```

**Debouncing Strategy:**
- Local state for immediate UI feedback
- Debounced URL updates (150ms) for performance
- `clearSort` and `resetSort` update URL immediately (no debounce)

### useSortBuilder Hook
Zustand store for coordinating popover state.

```tsx
const { isOpen, setOpen, open, close, toggle } = useSortBuilder();
```

Used to:
- Sync popover open state between `SortTool` and `SortChip`
- Auto-open bulk editor after first sort added via toolbar

## Data Flow

```
User Action → Local State → UI Updates → Debounced URL Update → Server Re-render
     ↑                                           ↓
     └───────────── Context Sync ←──────────────┘
```

1. User interacts (add/edit/remove sort)
2. `setLocalSort()` updates immediately
3. UI reflects change instantly
4. `debouncedUrlUpdate()` queues URL write
5. After 150ms, URL updates via nuqs
6. Server re-renders with new sort
7. Context updates, but `isInternalChange` flag prevents overwrite

## Key Design Decisions

### 1. Separation of Concerns
- **Base UI** (`/ui/toolbar/sort/`): Pure presentation, no hooks
- **Composed Components** (`/toolbars/notion/`): Use hooks, manage state

### 2. Composable Triggers
`SortTrigger` accepts any content as children, enabling:
```tsx
// Picker only
<SortTrigger variant="icon">
  <SortPicker />
</SortTrigger>

// Full bulk editor
<SortTrigger count={3} variant="count">
  <SortBulkEditor />
</SortTrigger>
```

### 3. Hook Instance Sharing
When a component inside a popover needs debounced updates, pass `addSort` from the parent to share the hook instance:

```tsx
// Parent (persists across popover open/close)
const { addSort } = useSortParams();

<SortTrigger>
  <SortPicker addSort={addSort} onSelect={() => close()} />
</SortTrigger>
```

### 4. Internal State with Optional Callbacks
Components handle default behavior internally via `useSortParams()`, but expose optional callbacks for additional actions:

```tsx
<SortBulkEditor
  onDeleteAll={() => setOpen(false)}  // Additional: close popover
  onSortsChange={(sorts) => track(sorts)}  // Additional: analytics
/>
```

### 5. Consistent Debouncing
All sort operations (except clear/reset) use debounced URL updates, consistent with filter and search behavior.

## File Structure

```
packages/dataview/src/
├── components/
│   ├── ui/toolbar/sort/           # Base UI (reusable)
│   │   ├── index.ts               # Exports
│   │   ├── sort-picker.tsx        # Property selection
│   │   ├── sort-editor.tsx        # Single rule editor
│   │   ├── sort-bulk-editor.tsx   # Multi-rule manager
│   │   ├── sort-trigger.tsx       # Popover shell
│   │   └── direction-picker.tsx   # Asc/Desc toggle
│   │
│   └── toolbars/notion/           # Notion-specific composed
│       ├── sort-chip.tsx          # Chips bar component
│       ├── sort-tool.tsx          # Toolbar button
│       └── chips-bar.tsx          # Container (uses SortChip)
│
└── hooks/
    ├── use-sort-params.ts         # Sort state management
    └── use-sort-builder.ts        # Popover state (Zustand)
```
