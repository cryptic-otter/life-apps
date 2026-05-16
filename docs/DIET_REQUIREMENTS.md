# Diet Tracker — Requirements

_Status: Draft · Author: Business Analysis session 2026-05-16_

---

## 1. Overview

The Diet page is being upgraded from a simple flat log (manually typed food + macros per entry) to a structured system with three layers:

1. **Food Library** — a personal database of food items with serving sizes and macros
2. **Meal Templates** — named collections of foods (e.g. "Oatmeal Bowl") that can be logged in one tap
3. **Daily Log** — the per-day record of what was eaten, grouped by meal category

---

## 2. Pages & Navigation

| Route | Purpose |
|---|---|
| `/diet` | Daily log — existing page, redesigned |
| `/diet/library` | Food library — CRUD for food items |
| `/diet/meals` | Meal templates — CRUD for templates |

Nav links for `/diet/library` and `/diet/meals` are accessible from the Diet page (e.g. sub-nav or header links). They do **not** appear in the top-level `Nav.tsx` component.

---

## 3. Food Library (`/diet/library`)

### 3.1 Data per food item

| Field | Type | Required | Notes |
|---|---|---|---|
| Name | text | ✅ | e.g. "Banana", "Rolled Oats" |
| Serving quantity | decimal | ✅ | e.g. `100`, `1`, `0.5` |
| Serving unit | text | ✅ | e.g. `g`, `slice`, `cup`, `piece` |
| Calories (per serving) | decimal | ❌ | kcal |
| Protein (per serving) | decimal | ❌ | grams |
| Carbs (per serving) | decimal | ❌ | grams |
| Fat (per serving) | decimal | ❌ | grams |

All macro fields are optional — a serving size must be defined but macros can be filled in later.

### 3.2 Operations

- **Create** a new food item via an inline form on the library page
- **Edit** an existing item (all fields editable inline or via edit form)
- **Delete** a food item

### 3.3 Retroactive update behaviour

When a food item's macros are edited, **all past and future log entries that reference that food item immediately reflect the new values** — macros are not stored at log-time, they are always read from the current food library record. This is the intentional behaviour.

---

## 4. Meal Templates (`/diet/meals`)

### 4.1 What a template is

A named collection of food items with serving counts. Example:

> **Oatmeal Bowl** = 1 serving Rolled Oats + 1 serving Banana + 1 serving Almond Milk

No meal category is assigned at template creation — category is chosen at log time.

### 4.2 Template items

Each item in a template is either:

**a) Library item** — references a `food_item_id` and stores a serving count. Macros are inherited from the library and stay current if the library item is edited.

**b) Ad-hoc item** — typed inline when building the template. Stores: name, serving qty, serving unit, and all four macro fields (all optional). These items exist only within the template; they are not added to the food library.

### 4.3 Default serving counts

Templates store the default serving count for each item. When logging a template, these defaults are pre-filled but are **editable before confirming the log entry**.

### 4.4 Operations

- **Create** a new template, adding items via type-ahead search (library) or free text (ad-hoc)
- **Add / remove items** from an existing template
- **Edit** item serving counts within a template
- **Rename** a template
- **Delete** a template

---

## 5. Daily Log (`/diet`)

### 5.1 Meal categories

Every logged entry belongs to exactly one of these categories:

- Breakfast
- Lunch
- Dinner
- Snack
- Pre-workout
- Post-workout

### 5.2 Logging paths

There are **two** ways to add entries to the day:

**Path A — Individual library item**
1. Open the log form
2. Type-ahead search the food library
3. Select an item
4. Enter the number of servings (defaults to 1)
5. Choose the meal category
6. Save

**Path B — Meal template**
1. Open the log form
2. Switch to "Meal" tab / option
3. Select a saved meal template
4. Review the list of items with their default serving counts — adjust any if needed
5. Choose the meal category
6. Save → creates one log entry per item in the template

> Ad-hoc (free-text) logging at the daily log level is **not supported**. Items must exist in the food library. The only place ad-hoc entries are created is inside meal template building (Section 4.2b).

### 5.3 Display

Entries are **grouped by meal category**. Within each category group:
- Items are listed in chronological (logged) order
- A calorie + macro subtotal is shown for each group
- Groups with no entries are hidden

### 5.4 Daily summary (top of page)

Displayed prominently at the top of the `/diet` page:

- Total Calories (kcal)
- Total Protein (g)
- Total Carbs (g)
- Total Fat (g)

### 5.5 Editing logged entries

On any logged entry, the user can:

| Action | Behaviour |
|---|---|
| **Change servings** | Update the serving count; macros for that entry recalculate immediately |
| **Change meal category** | Move entry to a different category group |
| **Change food item** | Swap the linked library item (macros update to match new item) |
| **Delete** | Remove the entry from today's log entirely |

Edits are inline or via a small edit form per entry — no separate edit page needed.

---

## 6. Database Design

### New tables (all follow existing RLS conventions — `user_id` + `auth.uid() = user_id` policy)

#### `food_items`
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references auth.users not null
name            text not null
serving_qty     numeric not null        -- e.g. 100
serving_unit    text not null           -- e.g. 'g'
calories        numeric                 -- per serving, nullable
protein_g       numeric                 -- per serving, nullable
carbs_g         numeric                 -- per serving, nullable
fat_g           numeric                 -- per serving, nullable
created_at      timestamptz default now()
```

#### `meal_templates`
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references auth.users not null
name        text not null
created_at  timestamptz default now()
```

#### `meal_template_items`
```sql
id                  uuid primary key default gen_random_uuid()
meal_template_id    uuid references meal_templates(id) on delete cascade not null
food_item_id        uuid references food_items(id) on delete set null   -- null = ad-hoc
name                text                -- required when food_item_id is null (ad-hoc)
servings            numeric not null default 1
serving_qty         numeric             -- ad-hoc only
serving_unit        text                -- ad-hoc only
calories            numeric             -- ad-hoc only
protein_g           numeric             -- ad-hoc only
carbs_g             numeric             -- ad-hoc only
fat_g               numeric             -- ad-hoc only
sort_order          integer not null default 0
```

#### `diet_log_entries` (replaces `diet_entries`)
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references auth.users not null
date            date not null
meal_category   text not null           -- breakfast | lunch | dinner | snack | pre-workout | post-workout
food_item_id    uuid references food_items(id) on delete set null  -- null = ad-hoc (from template)
food_name       text not null           -- denormalized for display; also the name for ad-hoc items
servings        numeric not null default 1
-- ad-hoc snapshot fields (only populated when food_item_id is null):
serving_qty     numeric
serving_unit    text
calories_snap   numeric
protein_snap    numeric
carbs_snap      numeric
fat_snap        numeric
created_at      timestamptz default now()
```

**Macro resolution rule** (applied in queries / UI):
- If `food_item_id` is set → macros come from the `food_items` record (live, retroactive)
- If `food_item_id` is null → macros come from the `*_snap` columns (frozen at log time)

### Migration strategy

The existing `diet_entries` table is superseded by `diet_log_entries`. Existing rows can be migrated: set `food_item_id = null`, copy the `food` column to `food_name`, copy macro columns to the snapshot fields, and map the existing meal strings to the new category set (add `pre-workout` / `post-workout` as new options).

---

## 7. Out of Scope

The following were explicitly excluded from this feature:

- Daily calorie / macro targets or goal tracking
- Calorie history charts or trends
- Importing food data from external sources (e.g. barcode scanner, USDA API)
- Social or sharing features
- Logging for dates other than today (no date picker)

---

## 8. Open Questions (resolved)

| Question | Decision |
|---|---|
| Serving model | Per-item: user specifies a qty + unit at library creation time |
| Meal template defaults | Pre-filled at log time; user can adjust before saving |
| Meal category on templates | Chosen at log time, not stored on the template |
| Log display | Grouped by meal category with per-group subtotals |
| Daily totals shown | Calories, Protein, Carbs, Fat |
| Edit actions on logged entries | Change servings, delete, change category, change food item |
| Library management location | Separate pages: `/diet/library` and `/diet/meals` |
| Search in log form | Type-ahead / live filter |
| Required library fields | Name + serving size only; all macros optional |
| Meal builder item sources | Library search OR ad-hoc inline |
| Library edit retroactivity | Always retroactive (macros read live from food_items) |
