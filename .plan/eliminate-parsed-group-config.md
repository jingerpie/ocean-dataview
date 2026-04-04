# Eliminate ParsedGroupConfig

## Problem

Two types represent the same thing with trivial naming differences:

```
GroupByConfig (discriminated union):     ParsedGroupConfig (flat):
  propertyId: "createdAt"                 property: "createdAt"
  propertyType: "date"                    propertyType: "date"
  showAs: "month"                         showAs: "month"

  propertyId: "title"                     property: "title"
  propertyType: "text"                    propertyType: "text"
  showAs: "alphabetical"                  textShowAs: "alphabetical"
```

`toParsedGroupConfig` exists only to rename `propertyId` → `property` and move text's `showAs` → `textShowAs`. This adds an unnecessary layer of indirection.

## Why `textShowAs` exists (and why it's unnecessary)

`textShowAs` was introduced in the initial commit (`370807e`) as part of `GroupingOptions` in `compute-data.ts`. The intent was to disambiguate text's `showAs` (exact/alphabetical) from date/status `showAs` (day/week/month/relative/option/group) within a flat options bag.

But this disambiguation was never needed at runtime — `getGroupKeyAndSortValue` already gates every branch on `property.type` before checking `showAs` or `textShowAs`:

```ts
if (property?.type === "date" && showAs && ...) { ... }     // uses showAs
if (property?.type === "status" && showAs === "group") { ... } // uses showAs
if (property?.type === "text" && textShowAs === "alphabetical") { ... } // uses textShowAs
```

Since `property.type` is always checked first, `showAs === "alphabetical"` would work identically in the text branch — it can never collide with date/status values.

When `ParsedGroupConfig` was introduced later (`55ee4fc`) for SQL builders, it mirrored the same `showAs`/`textShowAs` split from `GroupingOptions`. The server-side `build-group.ts` also reads `parsed.textShowAs` inside `case "text":` — which is already narrowed by `propertyType`. The separate field was never necessary on either side.

**Root cause:** `GroupingOptions` was designed as a flat bag without leveraging the `property.type` discriminant that was always available. `ParsedGroupConfig` inherited that same redundancy. Now that `GroupByConfig` exists as a proper discriminated union, both `textShowAs` and `ParsedGroupConfig` are artifacts of the original flat design.

## Decision: Eliminate ParsedGroupConfig

Use `GroupByConfig` everywhere. The discriminated union is strictly better — each switch case narrows the type, so `config.showAs` resolves to the correct type per branch. The flat `ParsedGroupConfig` loses that type narrowing by merging `showAs` and `textShowAs` into optional fields.

## What changes

### Phase 1: Server side (clean — all code already switches on propertyType)

#### 1a. `build-group.ts` — update function signatures

Replace `parsed: ParsedGroupConfig` with `config: GroupByConfig` in:
- `buildGroupBy(table, config, propertyConfig)`
- `buildGroupWhere(table, config, groupKey, propertyConfig)`

Update all internal references:
- `parsed.property` → `config.propertyId`
- `parsed.showAs` → `config.showAs` (already works per switch case due to discriminated union narrowing)
- `parsed.textShowAs` → `config.showAs` (in the `case "text":` branch, TS narrows to `TextGroupByConfig` which has `showAs?: TextShowAs`)
- `parsed.numberRange` → `config.numberRange` (in `case "number":` branch)
- `parsed.startWeekOn` → `config.startWeekOn` (in `case "date":` branch)

#### 1b. `schemas.ts` — remove transform

```diff
 const groupBySchema = z
   .object({
     type: groupByConfigSchema,
     key: z.string(),
   })
-  .transform(({ type, key }) => ({
-    parsed: toParsedGroupConfig(type),
-    key,
-  }))
   .nullish();
```

Remove `toParsedGroupConfig` import.

#### 1c. `product.ts` — pass GroupByConfig directly

```diff
 // getMany
 const groupWhere = groupBy
-  ? (buildGroupWhere(product, groupBy.parsed, groupBy.key) ?? undefined)
+  ? (buildGroupWhere(product, groupBy.type, groupBy.key) ?? undefined)
   : undefined;

 // getGroup — already has groupBy as GroupByConfig
-const parsed = toParsedGroupConfig(groupBy);
-const groupByResult = buildGroupBy(product, parsed);
+const groupByResult = buildGroupBy(product, groupBy);

 // getManyByColumn
-const parsed = toParsedGroupConfig(columnBy);
+const groupByResult = buildGroupBy(product, columnBy);
 ...
-const rowGroupWhere = groupBy
-  ? (buildGroupWhere(product, groupBy.parsed, groupBy.key) ?? undefined)
+const rowGroupWhere = groupBy
+  ? (buildGroupWhere(product, groupBy.type, groupBy.key) ?? undefined)
   : undefined;
```

Remove `toParsedGroupConfig` import.

### Phase 2: Client-side grouping contract

The client path has a separate flattened shape chain that also needs refactoring:

```
GroupByConfig → toParsedGroupConfig → InternalGroupConfig → GroupConfig → GroupingOptions
                                      (use-view-setup)      (use-group-config)  (compute-data)
```

All three intermediate types (`InternalGroupConfig`, `GroupConfig`, `GroupingOptions`) carry `textShowAs` as a separate field from `showAs`. This exists because `getGroupKeyAndSortValue` in `compute-data.ts` destructures `{ showAs, textShowAs }` independently — it checks `textShowAs === "alphabetical"` in a separate branch from date/status `showAs`.

**Decision: Unify `showAs` in the client grouping path too.**

The `getGroupKeyAndSortValue` function already switches on `property.type` before checking `showAs`/`textShowAs`. The text branch (line 231) checks `property?.type === "text" && textShowAs === "alphabetical"` — this can simply become `property?.type === "text" && showAs === "alphabetical"` since `showAs` is unambiguous when you already know the property type.

#### 2a. `compute-data.ts` — collapse `GroupingOptions`

```diff
 export interface GroupingOptions {
   numberRange?: { range: [number, number]; step: number };
   showAs?: "day" | "week" | "month" | "year" | "relative" | "option" | "group"
+        | "exact" | "alphabetical";
   startWeekOn?: "monday" | "sunday";
-  textShowAs?: "exact" | "alphabetical";
 }
```

Update `getGroupKeyAndSortValue`:
```diff
-const { showAs, startWeekOn, textShowAs, numberRange } = options;
+const { showAs, startWeekOn, numberRange } = options;
 ...
-if (property?.type === "text" && textShowAs === "alphabetical" && value) {
+if (property?.type === "text" && showAs === "alphabetical" && value) {
```

#### 2b. `use-group-config.ts` — collapse `GroupConfig`

```diff
 export interface GroupConfig {
   groupBy: string;
   hideEmptyGroups?: boolean;
   numberRange?: { range: [number, number]; step: number };
-  showAs?: "day" | "week" | "month" | "year" | "relative" | "group" | "option";
+  showAs?: "day" | "week" | "month" | "year" | "relative" | "group" | "option"
+        | "exact" | "alphabetical";
   sort?: "propertyAscending" | "propertyDescending";
   startWeekOn?: "monday" | "sunday";
-  textShowAs?: "exact" | "alphabetical";
 }
```

Update the `groupByProperty` call:
```diff
 const { groups, sortValues } = groupByProperty(data, activeGroupBy, properties, {
   showAs: effectiveShowAs,
   startWeekOn: groupConfig.startWeekOn,
-  textShowAs: groupConfig.textShowAs,
   numberRange: groupConfig.numberRange,
 });
```

#### 2c. `use-view-setup.ts` — remove `toParsedGroupConfig`, use `GroupByConfig` directly

Delete `InternalGroupConfig` type entirely — it duplicates `GroupConfig` from `use-group-config.ts`. Use `GroupConfig` directly.

```diff
-import type { GroupConfigInput, ParsedGroupConfig } from "../types/group.type";
-import { toParsedGroupConfig } from "../types/group.type";
+import type { GroupConfigInput } from "../types/group.type";

-const parsedGroup = useMemo(
-  () => (group ? toParsedGroupConfig(group) : undefined),
-  [group]
-);

 // Build GroupConfig directly from GroupConfigInput:
 return {
-  groupBy: parsedGroup.property,
+  groupBy: group.propertyId,
   hideEmptyGroups,
-  numberRange: parsedGroup.numberRange,
-  showAs: parsedGroup.showAs,
+  numberRange: group.propertyType === "number" ? group.numberRange : undefined,
+  showAs: "showAs" in group ? group.showAs : undefined,
   sort: sortMap[groupSortOrder],
-  startWeekOn: parsedGroup.startWeekOn,
-  textShowAs: parsedGroup.textShowAs,
+  startWeekOn: group.propertyType === "date" ? group.startWeekOn : undefined,
 };
```

Update `parsedGroup` references:
```diff
-parsedGroup?.property → group?.propertyId
+// In UseViewSetupResult, replace parsedGroup with group
```

Update `UseViewSetupResult`:
```diff
-parsedGroup: ParsedGroupConfig | undefined;
+group: GroupConfigInput | undefined;
```

#### 2d. `board-view/index.tsx` — remove `toParsedGroupConfig`, use `GroupByConfig` directly

```diff
-import { toParsedGroupConfig } from "../../../types/group.type";

-const parsedColumn = useMemo(
-  () => (columnConfig ? toParsedGroupConfig(columnConfig) : undefined),
-  [columnConfig]
-);
-const parsedGroup = useMemo(
-  () => (groupConfig ? toParsedGroupConfig(groupConfig) : undefined),
-  [groupConfig]
-);

 // Property lookups:
-parsedColumn?.property → columnConfig?.propertyId
-parsedGroup?.property  → groupConfig?.propertyId

 // groupDataByProperty call — showAs is unambiguous per branch:
-groupDataByProperty(items, parsedColumn.property, properties, {
-  showAs: parsedColumn.showAs,
-  startWeekOn: parsedColumn.startWeekOn,
-  textShowAs: parsedColumn.textShowAs,
-  numberRange: parsedColumn.numberRange,
+groupDataByProperty(items, columnConfig.propertyId, properties, {
+  showAs: "showAs" in columnConfig ? columnConfig.showAs : undefined,
+  startWeekOn: columnConfig.propertyType === "date" ? columnConfig.startWeekOn : undefined,
+  numberRange: columnConfig.propertyType === "number" ? columnConfig.numberRange : undefined,
 })
```

### No thin accessor helper needed

Every consumer already switches on `propertyType` or `property.type` before reading `showAs`. The discriminated union narrows the type in each branch. The ~3 call sites outside switch blocks use inline type guards (`"showAs" in config ? config.showAs : undefined`) which is less complexity than maintaining a helper function.

### Phase 3: Delete dead code and update docs

#### 3a. `group.type.ts` — delete `ParsedGroupConfig` and `toParsedGroupConfig`

Remove the "Parsed Group Config" section (lines 117-134) and "Adapter Functions" section (lines 136-191).

#### 3b. `types/index.ts` — remove re-exports

Remove `ParsedGroupConfig` and `toParsedGroupConfig` from the export list.

#### 3c. `.docs/group-filtering.md` — full consistency pass

The doc has broader drift beyond just the type reference:

| Line | Issue |
|------|-------|
| 24 | `date: TO_CHAR(...) = groupKey` — oversimplified, doesn't cover relative dates |
| 36-41 | API example shows `group: params.group` — actual schema uses `groupBy: { type, key }` |
| 47-51 | Type chain references `GroupFilter` — verify this type still exists |
| 58 | Says `buildGroupWhere` accepts `GroupByConfig \| ParsedGroupConfig` — should be `GroupByConfig` only |
| 67 | Path for deleted `combineGroupFilter` — correct as historical note but verify wording |

Rewrite to match post-refactor state: `buildGroupBy` and `buildGroupWhere` accept `GroupByConfig` directly, the Zod schema passes it through without transformation.

## Files to change

| File | Phase | Change |
|------|-------|--------|
| `packages/trpc/src/lib/build-group.ts` | 1 | `ParsedGroupConfig` → `GroupByConfig`, rename field accesses |
| `packages/trpc/src/lib/schemas.ts` | 1 | Remove `.transform()`, remove import |
| `packages/trpc/src/routers/product.ts` | 1 | Pass `GroupByConfig` directly, remove `toParsedGroupConfig` |
| `packages/dataview/src/utils/compute-data.ts` | 2 | Collapse `textShowAs` into `showAs` in `GroupingOptions` |
| `packages/dataview/src/hooks/use-group-config.ts` | 2 | Collapse `textShowAs` into `showAs` in `GroupConfig` |
| `packages/dataview/src/hooks/use-view-setup.ts` | 2 | Remove conversion, delete `InternalGroupConfig`, use `GroupByConfig` fields |
| `packages/dataview/src/components/views/board-view/index.tsx` | 2 | Remove conversion, use `GroupByConfig` fields directly |
| `packages/dataview/src/types/group.type.ts` | 3 | Delete `ParsedGroupConfig`, `toParsedGroupConfig` |
| `packages/dataview/src/types/index.ts` | 3 | Remove re-exports |
| `.docs/group-filtering.md` | 3 | Full consistency pass against post-refactor state |
