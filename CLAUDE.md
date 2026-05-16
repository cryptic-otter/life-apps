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

## Architecture

Personal productivity suite — diet, strength, and cardio trackers — built as a single Next.js app deployed on Vercel with Supabase as the backend.

### Page + Form pattern

Every tracker follows the same two-file pattern:

- **`src/app/[tracker]/page.tsx`** — async Server Component. Fetches data, defines all Server Actions inline (with `'use server'`), passes actions as props to the form component.
- **`src/app/[tracker]/[Tracker]Form.tsx`** — `'use client'` component. Handles open/close toggle and form reset only. Receives the Server Action as a prop and calls it via `form action={...}`.

Server Actions always call `supabase.auth.getUser()` themselves to get `user.id` — never trust user_id from the client.

Every mutation ends with `revalidatePath('/[tracker]')` to trigger a server re-render.

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

Migrations live in `supabase/migrations/`. To apply: paste into the Supabase SQL Editor and run. There is no CLI migration runner configured.

### Dashboard

`src/app/page.tsx` fetches a summary stat from each tracker table in parallel (`Promise.all`) and renders clickable stat cards. When adding a new tracker, add a parallel fetch here and a new `<Link>` card.

### Adding a new tracker

1. Write a new migration in `supabase/migrations/` — follow the `user_id` + RLS convention, run it in the Supabase SQL Editor
2. Create `src/app/[name]/page.tsx` — copy the structure from `diet/page.tsx`
3. Create `src/app/[name]/[Name]Form.tsx` — copy the structure from `diet/DietForm.tsx`
4. Add a stat card to `src/app/page.tsx` (dashboard)
5. Add a nav link to `src/components/Nav.tsx`

### Deployment

Push to `main` on GitHub → Vercel auto-builds and deploys. Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) must be set in the Vercel dashboard as well as in `.env.local` locally. See `.env.local.example` for the required keys.

### Tailwind

Uses Tailwind v4, which imports via `@import "tailwindcss"` in `globals.css` — not the v3 `@tailwind` directives. The theme is configured with CSS variables under `@theme inline`.
