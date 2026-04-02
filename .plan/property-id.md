# Plan: Separate `id` / `key` on properties

## Problem

`property.id` is overloaded — data accessor, identity, and display fallback. Formula/button properties already break the contract since their `id` doesn't map to any data field.

## Design

- `key: string` — data field accessor (`item[key]`). Required for data-backed types.
- `id?: string` — unique identity. Defaults to `key` if omitted. Used for React keys, filter/sort/group refs, URL params, visibility.
- Formula & button types: `id` required, `key?: never` (no data field).
- No backward compatibility needed.

### Resolved Decisions

1. **Normalization**: `id ?? key` resolved once in a `normalizeProperties()` utility, called at provider level.
2. **URL params**: reference by `id` (identity). Data access uses `key`.
3. **Data flow**: `item[property.key]` for reading. Transformed data keyed by `key` (data stays aligned with source fields).
4. **ID generation**: derived from `key`, not random (deterministic URLs, human-readable, no persistence layer).

## Execution Steps

### Step 1: Types (`property.type.ts`)
- [ ] `BaseProperty<T>`: replace `id: string` with `key: string` + `id?: string`
- [ ] `FormulaPropertyType<T>`: `id: string` required, `key?: never`
- [ ] `ButtonPropertyType<T>`: `id: string` required, `key?: never`
- [ ] `PropertyMeta`: add `key?: string`, keep `id: string` (resolved)
- [ ] Update `toPropertyMeta`, `toPropertyMetaArray` — include `key`
- [ ] Update `getSearchableProperties` — use `p.key ?? p.id` for field mapping, `p.id` for identity
- [ ] Update `PropertyKeys` type to use `"id"` (already does)

### Step 2: Normalizer utility
- [ ] Create `normalizeProperties()` — resolves `id ?? key` for each property, validates no duplicate IDs

### Step 3: Data access sites (~6 files)
- [ ] `compute-data.ts` — `item[property.key]` instead of `item[property.id]` / `item[propertyId]`
- [ ] `data-card.tsx` — `item[property.key]`
- [ ] Any other `item[property.id]` sites

### Step 4: Consumer property definitions
- [ ] All property definition arrays: rename `id:` → `key:` (keep `id:` on formula/button)

### Step 5: Verify
- [ ] `bun run check && bun run check-types`
- [ ] `bun run build`
