# [Ocean DataView](https://ocean-dataview.sparkyidea.com)

Notion-style data views for React: table, list, gallery, board, and charts with filtering, sorting, grouping, and URL-synced state.

[![Ocean DataView](./showcase/output/showcase.gif)](https://ocean-dataview.sparkyidea.com)

[![License: MIT](https://img.shields.io/github/license/jingerpie/ocean-dataview)](./LICENSE)
[![CI](https://github.com/jingerpie/ocean-dataview/actions/workflows/ci.yml/badge.svg)](https://github.com/jingerpie/ocean-dataview/actions/workflows/ci.yml)

## Why I Built This

Traditional approach (fragmented):

```mermaid
flowchart TB
    subgraph OLD
        direction TB
        O1["Data A"] --> L1["react-table / ag-grid"] --> V1["Table View"]
        O2["Data B"] --> L2["flatlist / ulList"] --> V2["List View"]
        O3["Data C"] --> L3["masonry / photo-gallery"] --> V3["Gallery View"]
        O4["Data D"] --> L4["react-kanban / trello-clone"] --> V4["Board View"]
    end

    classDef dataNode fill:#2563eb22,stroke:#2563eb,stroke-width:2px;
    classDef libNode fill:#f59e0b22,stroke:#f59e0b,stroke-width:2px;
    classDef viewNode fill:#ef444422,stroke:#ef4444,stroke-width:2px;

    class O1,O2,O3,O4 dataNode;
    class L1,L2,L3,L4 libNode;
    class V1,V2,V3,V4 viewNode;

    style OLD fill:#ef444414,stroke:#ef4444,stroke-width:2px
```

Notion's elegant approach to data visualization inspired this unified model:

```mermaid
flowchart TB
    subgraph NEW
        direction TB
        P["Properties Schema
        id: string
        title: string
        status: select
        assignee: person
        date: date
        cover: image
        tags: multi-select
        priority: number"] --> E["View Engine (single renderer)"]

        E --> T["Table View"]
        E --> L["List View"]
        E --> G["Gallery View"]
        E --> B["Board View"]
    end

    classDef schemaNode fill:#2563eb22,stroke:#2563eb,stroke-width:2px;
    classDef engineNode fill:#f59e0b22,stroke:#f59e0b,stroke-width:2px;
    classDef outNode fill:#8b5cf622,stroke:#8b5cf6,stroke-width:2px;

    class P schemaNode;
    class E engineNode;
    class T,L,G,B outNode;

    style NEW fill:#22c55e14,stroke:#22c55e,stroke-width:2px
```

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com)
- **State Management:** [nuqs](https://nuqs.47ng.com) (URL state)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query) + [tRPC](https://trpc.io)
- **API Server:** [Hono](https://hono.dev)
- **Database:** [PostgreSQL](https://www.postgresql.org)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team)

## Features

- [x] Multiple view types: `TableView`, `ListView`, `GalleryView`, `BoardView`
- [x] Chart views: vertical bar, horizontal bar, line, area, donut
- [x] Notion-style toolbar with filters, sort, search, group, visibility
- [x] Rich property system (text, number, select, multi-select, status, date, media, checkbox, url, email, phone, formula, button)
- [x] Server-side pagination, sorting, filtering, and grouping
- [x] Pagination modes: page, load-more, infinite scroll
- [x] URL-driven state with shareable links
- [x] Per-column/group pagination for board view

## Running Locally

### Prerequisites

- Bun `>= 1.3.9`
- Node.js `>= 20`
- PostgreSQL `>= 15`

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/jingerpie/ocean-dataview
   cd ocean-dataview
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp apps/server/.env.example apps/server/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

   Update with your database credentials:
   - `apps/server/.env`: Set `DATABASE_URL` and `CORS_ORIGIN=http://localhost:3001`
   - `apps/web/.env.local`: Set `NEXT_PUBLIC_SERVER_URL=http://localhost:3000`

4. **Set up database**

   ```bash
   bun run db:push   # Push schema
   bun run db:seed   # Seed demo data
   ```

5. **Start development servers**

   ```bash
   bun run dev
   ```

   - Web: [http://localhost:3001](http://localhost:3001)
   - API: [http://localhost:3000](http://localhost:3000)

## Roadmap

- [ ] Documentation site (in progress)
- [ ] shadcn CLI integration
- [ ] Resizable table columns
- [ ] Chart (in progress)
- [ ] Timeline view
- [ ] Feed view
- [ ] Map view
- [ ] Calendar view
- [ ] Form view

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md).

## Credits

- [shadcn/ui](https://github.com/shadcn-ui/ui) - For the beautiful UI components
- [tablecn](https://github.com/sadmann7/tablecn) - For README structure and project inspiration

## License

MIT - see [LICENSE](./LICENSE).
