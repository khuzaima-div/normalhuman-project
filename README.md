# Normal Human

A calm, AI-powered email client built with Next.js 15, Clerk, Prisma, Aurinko, and Orama.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Auth | Clerk |
| Database | PostgreSQL + Prisma |
| API | tRPC + REST webhooks |
| Email sync | Aurinko |
| Search / RAG | Orama + OpenAI embeddings |
| AI chat | OpenAI (gpt-4o-mini) |
| UI | shadcn/ui + Tailwind CSS v4 |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in all values:

- **DATABASE_URL** — PostgreSQL connection string
- **NEXT_PUBLIC_APP_URL** — Public app URL (no trailing slash)
- **Clerk** — `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- **Aurinko** — `AURINKO_CLIENT_ID`, `AURINKO_CLIENT_SECRET`
- **OpenAI** — `OPENAI_API_KEY`
- **Stripe** (optional) — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`

For local webhook testing, use an ngrok tunnel and set `NEXT_PUBLIC_APP_URL` to the tunnel URL.

### 3. Set up the database

```bash
npm run db:generate
npm run db:push
# or, for migration-based workflows:
# npm run db:dev
```

On an existing database that already has the schema, mark the baseline migration as applied:

```bash
npx prisma migrate resolve --applied 20250710120000_baseline
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```mermaid
flowchart LR
  User --> Clerk
  Clerk --> App[Next.js App]
  App --> tRPC
  App --> REST[REST Routes]
  tRPC --> Prisma[(PostgreSQL)]
  Aurinko -->|OAuth + webhooks| REST
  REST --> Orama[Orama Index]
  Chat[/api/chat] --> Orama
  Chat --> OpenAI
```

### Key flows

1. **Account linking** — User connects Google via Aurinko OAuth → initial sync runs in background
2. **Delta sync** — Aurinko webhook triggers incremental sync via `nextDeltaToken`
3. **Search** — Orama full-text search via tRPC `search.search`
4. **AI chat** — Hybrid vector search → RAG context → streamed GPT response

## Project structure

```
src/
├── app/              # Next.js routes (pages + API)
├── components/       # Shared UI + email editor
├── hooks/            # React hooks (navigation, threads, accounts)
├── lib/              # Aurinko sync, embeddings, Stripe actions
├── server/           # tRPC routers, Prisma client, Orama manager
└── styles/           # Global CSS + design tokens
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:dev` | Create/apply migrations (dev) |
| `npm run db:push` | Push schema without migrations |
| `npm run db:migrate` | Deploy migrations (production) |

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Command palette |
| `/` | Focus search |
| `j` / `k` | Navigate threads |
| `Escape` | Clear selection / close search |
| `g i` | Go to Inbox |
| `g d` | Go to Drafts |
| `g s` | Go to Sent |
| `g u` | Show Done emails |

## QA checklist

- [ ] Sign in via Clerk
- [ ] Connect Google account (Aurinko OAuth)
- [ ] Initial sync populates inbox
- [ ] Sidebar navigation: Inbox / Drafts / Sent
- [ ] Inbox Active / Done filters work
- [ ] Search returns results
- [ ] AI chat responds with email context
- [ ] Compose and reply work
- [ ] Light / dark mode consistent
- [ ] KBar command palette shortcuts work
