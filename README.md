# Life Apps

A personal productivity suite — diet, strength, cardio, and meal planning trackers — built as a single Next.js app deployed on Vercel with Supabase as the backend.

## Features

| Page | What it does |
|---|---|
| **Dashboard** (`/`) | Daily snapshot — calories logged, strength sets, cardio minutes, and weekly meal coverage |
| **Diet** (`/diet`) | Log food against a meal category, browse past days, track daily macro totals |
| **Diet → Library** (`/diet/library`) | Reusable food item library with nutritional info per serving |
| **Diet → Meals** (`/diet/meals`) | Meal templates — named collections of foods for quick logging |
| **Strength** (`/strength`) | Log sets per exercise from a reusable exercise library; view session history |
| **Cardio** (`/cardio`) | Swim session log tied to a fixed weekly training schedule; tracks distance, sleep quality, and fuel level |
| **Meal Planner** (`/meal-plan`) | Weekly coverage table — check off which meals are sorted for Mon–Sun. Slots already logged in the diet tracker auto-populate as covered |
| **Schema** (`/schema`) | Live ERD of all database tables |

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Database:** Supabase (Postgres + Auth + Row Level Security)
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel (auto-deploy on push to `main`)

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app requires a Supabase project — see `supabase/migrations/` for the full schema.

## Architecture

Every tracker follows a **Page + Form pattern**:

- `src/app/[tracker]/page.tsx` — async Server Component; fetches data, defines Server Actions inline, passes them as props
- `src/app/[tracker]/[Tracker]Form.tsx` — `'use client'` component; handles UI state only, calls actions via `form action={...}`

Server Actions always call `supabase.auth.getUser()` themselves — user identity is never trusted from the client.

Row Level Security is enabled on every table (`auth.uid() = user_id`), so users only ever see their own data.

See [`CLAUDE.md`](CLAUDE.md) for full developer guidance and [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) for the database schema.

## Project Docs

| File | Contents |
|---|---|
| `CLAUDE.md` | Developer conventions, architecture patterns, migration workflow |
| `docs/DATA_MODEL.md` | Full ERD and table descriptions |
| `docs/CARDIO_REQUIREMENTS.md` | Cardio tracker requirements |
| `docs/DIET_REQUIREMENTS.md` | Diet tracker requirements |
| `docs/STRENGTH_REQUIREMENTS.md` | Strength tracker requirements |
| `docs/MEAL_PLAN_REQUIREMENTS.md` | Meal planner requirements |
