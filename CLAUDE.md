# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build (also validates types)
npm run lint     # eslint
npx tsc --noEmit # type-check without building
```

No test suite exists yet.

## Git Workflow

Always type-check before committing: `npx tsc --noEmit`. If clean, commit and push in one step — do not ask the user for confirmation before pushing to main.

## Supabase MCP

The Supabase MCP is configured in `.mcp.json` and scoped to this project (`hjdxubmwdfravioeejpi`). Use it to run migrations directly — **do not ask the user to paste SQL into the Supabase dashboard**.

### Access token

The `SUPABASE_ACCESS_TOKEN` is stored in two local-only files that are **never committed to git**:

- `.env.local` — look for the `SUPABASE_ACCESS_TOKEN=` line at the bottom of the file
- `.mcp.json` — token is hardcoded in the `env` block (the committed version uses a placeholder; the local copy has the real value, and `git update-index --assume-unchanged .mcp.json` prevents it from ever being staged)

**The MCP tools work out of the box in this repo.** Always use them — never ask the user to run SQL manually.

### Migration workflow

1. Write the SQL file in `supabase/migrations/` (e.g. `003_my_change.sql`)
2. Execute it via the Supabase MCP (`mcp__supabase__execute_sql` tool)
3. Confirm the query returns successfully before writing any front-end code that depends on it

## Architecture

Personal productivity suite — diet, strength, and cardio trackers — built as a single Next.js app deployed on Vercel with Supabase as the backend.

### Page + Form pattern

Every tracker follows the same two-file pattern:

- **`src/app/[tracker]/page.tsx`** — async Server Component. Fetches data, defines all Server Actions inline (with `'use server'`), passes actions as props to the form component.
- **`src/app/[tracker]/[Tracker]Form.tsx`** — `'use client'` component. Handles open/close toggle and form reset only. Receives the Server Action as a prop and calls it via `form action={...}`.

Server Actions always call `supabase.auth.getUser()` themselves to get `user.id` — never trust user_id from the client.

Every mutation ends with `revalidatePath('/[tracker]')` to trigger a server re-render.

### Cardio tracker — swim-specific pattern

The cardio page is built around a fixed weekly swim schedule. It uses an extra shared file:

- **`src/app/cardio/schedule.ts`** — exports `SCHEDULE` (the weekly plan), types (`DaySchedule`, `SwimEntry`, `WeekDay`), and `getRowStatus`. **Do not modify the schedule without discussing with the user first** — it reflects their actual training programme.

Requirements for the cardio redesign live in `docs/CARDIO_REQUIREMENTS.md`.

### Two Supabase clients — use the right one

| File | When to use |
|---|---|
| `src/lib/supabase/server.ts` | Server Components, Server Actions, middleware, API routes — anything that runs on the server. Uses Next.js `cookies()`. |
| `src/lib/supabase/client.ts` | `'use client'` components only — currently just the login page for `signInWithPassword` / `signUp`. |

Never use the browser client in a server context or vice versa.

### Auth

`src/middleware.ts` runs at the edge on every request. Any path not starting with `/auth` requires a valid Supabase session cookie; otherwise it redirects to `/auth/login`. The middleware also refreshes expiring session tokens.

The auth callback route at `src/app/api/auth/callback/route.ts` handles email confirmation links from Supabase.

### Database

All tables share the same conventions:
- `id uuid` primary key, `user_id uuid references auth.users not null`, `date date`, `created_at timestamptz`
- Row Level Security enabled on every table with policy `auth.uid() = user_id` — users only ever see their own rows
- Because RLS handles ownership, `delete` Server Actions only need `.eq('id', id)` — no explicit user check required

Migrations live in `supabase/migrations/`. Run them via the Supabase MCP — see workflow above.

### Dashboard

`src/app/page.tsx` fetches a summary stat from each tracker table in parallel (`Promise.all`) and renders clickable stat cards. When adding a new tracker, add a parallel fetch here and a new `<Link>` card.

### Adding a new tracker

1. Write a new migration in `supabase/migrations/` — follow the `user_id` + RLS convention, run via Supabase MCP
2. Create `src/app/[name]/page.tsx` — copy the structure from `diet/page.tsx`
3. Create `src/app/[name]/[Name]Form.tsx` — copy the structure from `diet/DietForm.tsx`
4. Add a stat card to `src/app/page.tsx` (dashboard)
5. Add a nav link to `src/components/Nav.tsx`

### Deployment

Push to `main` on GitHub → Vercel auto-builds and deploys. Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) must be set in the Vercel dashboard as well as in `.env.local` locally. See `.env.local.example` for the required keys.

### Tailwind

Uses Tailwind v4, which imports via `@import "tailwindcss"` in `globals.css` — not the v3 `@tailwind` directives. The theme is configured with CSS variables under `@theme inline`.

### Dark mode

The app supports dark mode via Tailwind `dark:` variants. The body background is driven by a CSS variable in `globals.css` that switches to `#0a0a0a` when `prefers-color-scheme: dark`. All components must include `dark:` variants for background, border, and text colours.

## Skills

- `/business-analyst` — structured requirements gathering followed by a formal requirements document. Use at the start of any new feature before writing code.
- `/deploy` — type-check, commit, and push in one step.

## Project docs

Requirements documents live in `docs/`. Always check this directory for existing requirements before starting work on a feature.
