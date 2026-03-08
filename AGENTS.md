# AGENTS.md

Detailed guidance for AI coding assistants working with the Ocean DataView monorepo.

This file provides comprehensive instructions for maintaining code quality, architectural consistency, and project-specific requirements.

## 1. Repository Structure

This is a Turborepo monorepo containing a full-stack data visualization platform.

### Apps

- **apps/web** - Next.js 16 frontend (port 3001)
  - Page routes for each view type (table, list, gallery, board, charts)
  - Demo modules showcasing dataview components
  - Uses React 19, TailwindCSS 4, shadcn/ui

- **apps/server** - Hono API server (port 3000)
  - Lightweight HTTP server with tRPC router
  - Handles data fetching, filtering, pagination

### Packages

- **packages/dataview** - Core React components (`@sparkyidea/dataview`)
  - View components: TableView, ListView, GalleryView, BoardView
  - Hooks: pagination, filtering, sorting, grouping
  - Providers: DataViewProvider, QueryBridge, ToolbarContext
  - UI components: toolbar, filters, pagination controls

- **packages/db** - Database layer (`@sparkyidea/db`)
  - Drizzle ORM schema and migrations
  - PostgreSQL connection setup
  - Seed data utilities

- **packages/shared** - Shared utilities (`@sparkyidea/shared`)
  - Type definitions (filter, sort, group, pagination)
  - URL DSL parsers for query state
  - Configuration utilities

- **packages/trpc** - tRPC router (`@sparkyidea/trpc`)
  - Product router with getMany, getGroup, getManyByColumn
  - SQL builders for filter/sort/group operations
  - Cursor-based pagination logic

- **packages/ui** - UI component library (`@sparkyidea/ui`)
  - shadcn/ui components
  - Shared styles and themes

- **packages/env** - Environment variables (`@sparkyidea/env`)
- **packages/config** - Build configuration (`@sparkyidea/config`)

### Prerequisites

- Bun >= 1.3.9
- Node.js >= 20 (for some tooling)
- PostgreSQL >= 15

## 2. Core Development Principles

### Philosophy

- **Move fast while maintaining high standards** - prioritize clarity over cleverness
- **Read the relevant code first** - follow existing patterns and naming
- **Keep solutions small and simple** - favor functions over classes
- **Prefer immutability** - don't mutate inputs; return new values
- **Handle errors up-front** - use guard clauses and early returns

### Separation of Concerns

- **Keep business logic separate from UI components**
- Extract logic into `lib/`, `utils/`, or hooks
- UI components should orchestrate, not implement complex logic
- Views consume hooks, hooks consume providers

### Fail-Fast, No Fallbacks

- **No Silent Fallbacks**: Code must fail immediately when conditions aren't met
- **Explicit Error Messages**: Clear messages explaining what failed
- **Data Mapping**: Handle all known values explicitly, throw for unknown

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files/directories | kebab-case | `use-page-pagination.ts` |
| Components | PascalCase | `TableView`, `FilterPicker` |
| Hooks | camelCase with `use` | `usePagePagination` |
| Functions | camelCase verbs | `buildWhere`, `parseGroupBy` |
| Constants | UPPER_SNAKE_CASE | `LIMIT_OPTIONS` |
| Types/Interfaces | PascalCase | `DataViewProperty` |
| Booleans | is/has/can/should prefix | `isLoading`, `hasNextPage` |
| ENV vars | UPPER_SNAKE_CASE | `DATABASE_URL` |

### Code Organization

- Keep functions short and single-purpose (<20 statements)
- Keep files focused (<300 lines ideal)
- Avoid `let` - make a new function that returns the value
- Prefer early exits over deep nesting
- Use map/filter for iteration, avoid forEach

## 3. TypeScript Standards

### Type Safety

- **No `any`** - use `unknown` and narrow it down
- **Prefer `Record<string, unknown>` over `object`**
- **Do not disable ESLint/TypeScript rules** - fix the root cause
- **Constrain generics** with `extends` - avoid overly broad `<T>`
- **Use discriminated unions** for mutually exclusive states

### Type Inference

- **Do not add unnecessary type annotations** when inference works
- **Let TypeScript infer return types** when obvious
- **Avoid type casts (`as`)** unless unavoidable
- **Use `satisfies`** to check object literals match a type

### Async/Await

- **Any function returning a Promise must be `async`**
- **Always use `await`** when calling async functions
- **Avoid `.then()`/`.catch()`** - prefer try/catch
- **Avoid IIFEs** as workarounds for async

### Control Flow

- **Avoid nested ternaries** - use if/else or switch
- **Use `switch` for multiple values** - leverage exhaustiveness checking
- **Prefer string methods over RegEx** when possible

## 4. Frontend Development (React + Next.js)

### Component Architecture

- **Functional components only** - no classes
- **TypeScript everywhere** - interfaces for props
- **Components consume context** - don't prop-drill excessively

### DataView Component Pattern

Each view follows this pattern:

```typescript
export function TableView<TData, TProperties extends readonly DataViewProperty<TData>[]>({
  pagination,
  onRowClick,
  // ...
}: TableViewProps<TData>) {
  // 1. Get context
  const { data, properties, counts } = useDataViewContext<TData, TProperties>();

  // 2. Setup view (grouping, validation)
  const { groups, groupByPropertyDef } = useViewSetup({ ... });

  // 3. Filter visible properties
  const displayProperties = useDisplayProperties(properties, visibility);

  // 4. Render with Suspense per group
  return groups.map(group => (
    <Suspense key={group.key} fallback={<Skeleton />}>
      <SuspendingGroupContent group={group}>
        {(result) => <GroupRenderer data={result.items} />}
      </SuspendingGroupContent>
    </Suspense>
  ));
}

// Static properties for type detection
TableView.dataViewType = "table";
TableView.defaultLimit = 25;
```

### State Management

- **URL as source of truth** - all query state in URL params via `nuqs`
- **TanStack Query** for server state caching
- **React Context** for structural state (data, properties)
- **Suspense** for loading boundaries per group

### Layout & Styling (Tailwind + shadcn)

- Use flex/grid for layout
- Manage spacing with `gap-*` and `p-*` (avoid margins)
- Prefer minimal Tailwind; avoid ad-hoc CSS
- Use shadcn/ui components from `packages/ui`

### Accessibility

- Use buttons for clickable elements, not divs
- Use proper aria labels and roles
- Use semantic HTML elements

## 5. Backend Development (Hono + tRPC)

### Architecture

- **Hono** for lightweight HTTP handling
- **tRPC** for type-safe API routes
- **Drizzle** for database queries

### tRPC Router Structure

```typescript
// packages/trpc/src/routers/product.ts
export const productRouter = createRouter({
  getMany: publicProcedure
    .input(getManySchema)
    .query(async ({ input, ctx }) => {
      // Build WHERE clause from filter
      // Build ORDER BY from sort
      // Apply cursor pagination
      return { items, hasNextPage, ... };
    }),

  getGroup: publicProcedure
    .input(getGroupSchema)
    .query(async ({ input, ctx }) => {
      // Return group counts for accordion headers
      return { counts, sortValues, nextCursor };
    }),
});
```

### SQL Building

SQL builders in `packages/trpc/src/lib/`:

- `filter-columns.ts` - WhereNode tree → Drizzle SQL
- `sort-columns.ts` - Sort + cursor pagination
- `group-columns.ts` - Group aggregation

## 6. Database (Drizzle ORM)

- **Source of truth**: `packages/db/src/schema/`
- **Do not hand-edit** generated SQL
- **Generate migrations** with `bun run db:generate`

### Commands

```bash
bun run db:push      # Push schema changes (dev)
bun run db:generate  # Generate migrations
bun run db:migrate   # Apply migrations
bun run db:studio    # Open Drizzle Studio
```

## 7. Architecture Patterns

### View Types

| View | Purpose | Pagination |
|------|---------|------------|
| Table | Spreadsheet with columns | Page (prev/next) |
| List | Vertical item list | Infinite scroll |
| Gallery | Grid of cards | Infinite scroll |
| Board | Kanban columns | Per-column infinite |

### Data Flow

```
URL Params → QueryBridge → TanStack Query → tRPC → Drizzle → PostgreSQL
     ↓
DataViewProvider (Context)
     ↓
View Component (Table/List/Gallery/Board)
     ↓
UI with Suspense boundaries
```

### Filter System

SQL-inspired tree structure:

```typescript
// Leaf node
interface WhereRule {
  property: string;
  condition: "eq" | "ne" | "gt" | "lt" | "iLike" | ...;
  value?: unknown;
}

// Branch node
interface WhereExpression {
  and?: WhereNode[];
  or?: WhereNode[];
}
```

### Group Configuration

Discriminated union for type safety:

```typescript
type GroupByConfig =
  | { byDate: { property: string; showAs: "day"|"week"|"month" } }
  | { byStatus: { property: string; showAs: "option"|"group" } }
  | { bySelect: { property: string } }
  | { byCheckbox: { property: string } }
  // ...
```

## 8. Development Workflow

### Commands

```bash
# Development
bun run dev          # Start all apps
bun run dev:web      # Start web only (port 3001)
bun run dev:server   # Start server only (port 3000)

# Quality (required before PRs)
bun run check        # Lint + format check (Ultracite)
bun run check-types  # TypeScript check
bun run build        # Build all packages

# Database
bun run db:push      # Push schema (dev)
bun run db:studio    # Open Drizzle Studio
```

### Pre-commit Verification

```bash
bun run check        # Ultracite (Biome)
bun run check-types  # TypeScript
bun run build        # Full build
```

## 9. Git Workflow

### Conventional Commits

All PR titles MUST follow this format:

```
<type>(scope): <description>
```

Examples:
```
feat(dataview): add board view pagination
fix(trpc): handle null cursor in getMany
refactor(shared): simplify filter parser
```

**Types**: feat, fix, refactor, docs, test, chore, perf

**Scopes**: dataview, trpc, db, shared, web, server, ui

## 10. What Agents MUST Do

- Run `bun run check && bun run check-types` before commits
- Follow existing patterns and naming conventions
- Add types for all new functions
- Update documentation for user-facing changes
- Test cross-package changes together

## 11. What Agents MUST NOT Do

- Don't introduce dependencies without explicit request
- Don't commit secrets - use env files
- Don't disable linting/TypeScript rules
- Don't create barrel files (`index.ts` that re-exports everything)
- Don't use `any` - use `unknown` and narrow

## 12. Common Tasks

### Add a new view type

1. Create `packages/dataview/src/components/views/new-view/index.tsx`
2. Use `useDataViewContext()` and `useViewSetup()`
3. Implement with Suspense boundaries per group
4. Add static properties (`dataViewType`, `defaultLimit`)
5. Export via package.json exports

### Add a filter condition

1. Add to conditionValues in `packages/shared/src/types/filter.type.ts`
2. Implement in `packages/trpc/src/lib/filter-columns.ts`
3. Add UI in `packages/dataview/src/components/ui/toolbar/filter/`

### Add a property type

1. Add to PropertyType enum in `packages/dataview/src/types/`
2. Create config interface
3. Implement cell rendering
4. Add filter/group/sort handling

### Modify database schema

1. Edit `packages/db/src/schema/*.ts`
2. Run `bun run db:push` to sync
3. Update tRPC router if needed

## 13. Key Files Reference

| Purpose | Location |
|---------|----------|
| View components | `packages/dataview/src/components/views/` |
| Hooks | `packages/dataview/src/hooks/` |
| Context providers | `packages/dataview/src/lib/providers/` |
| Type definitions | `packages/shared/src/types/` |
| URL parsers | `packages/shared/src/utils/parsers/` |
| tRPC routers | `packages/trpc/src/routers/` |
| SQL builders | `packages/trpc/src/lib/` |
| DB schema | `packages/db/src/schema/` |
| Architecture docs | `docs/` |
