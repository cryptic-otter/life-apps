# Meal Planner — Requirements Document
**Project:** Life Apps
**Prepared by:** Business Analyst
**Date:** 2026-05-17
**Status:** Draft v1.0

---

## 1. Background & Objective

The user wants a dedicated weekly meal planning page to track whether each meal slot for the current week is "covered" — i.e. food is sorted. This is a planning and accountability tool, not a nutrition tracker. It sits alongside the diet tracker but serves a different purpose: forward-looking coverage vs. backward-looking logging.

---

## 2. Domain Context

The diet tracker already uses a `meal_category` field on `diet_log_entries` with exactly 6 values: `breakfast | lunch | dinner | snack | pre-workout | post-workout`. These map 1:1 to the 6 meal slots required here. The week runs Monday–Sunday. The page always shows the **current week only** — no navigation.

---

## 3. Page Layout

### 3.1 Page Header
- Title: "Meal Planner"
- Subtitle showing the current week range, e.g. "12 May – 18 May"

### 3.2 Coverage Table
A 7×6 grid:
- **Rows** = Days of the week: Monday through Sunday
- **Columns** = Meal slots: Breakfast · Lunch · Dinner · Pre-workout · Post-workout · Snack

Column headers sit across the top. Row headers (day name + date number, e.g. "Mon / 12") sit down the left.

### 3.3 Cell States

| State | Appearance | Interaction |
|---|---|---|
| Empty | Default background, empty note, unchecked | Editable |
| Planned (note only) | Default background, note text visible, unchecked | Editable |
| Covered (checked) | **Green background**, note text visible | Editable |
| Diet-logged | **Green background**, displays "Logged", read-only | None |

- Diet-logged cells take priority: if `diet_log_entries` has any entry for that date + meal category, the cell renders as Diet-logged and is locked.
- All other cells are editable inline.

### 3.4 Cell Anatomy (editable cells)
Each cell contains:
1. A small **text input** for the meal note (free text, optional)
2. A **checkbox** to mark the meal as covered

The note and checkbox are independent — a note can be present without being checked, and a cell can be checked with no note.

---

## 4. Input Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `note` | Text input | No | Free text, not linked to food/meal library |
| `is_covered` | Checkbox | No | Toggling green background on/off |

---

## 5. Business Rules

| Rule | Detail |
|---|---|
| Current week only | Page always renders Mon–Sun of the current ISO week. No date navigation. |
| Auto-population | On page load, query `diet_log_entries` for all entries within the current week. Any date + meal_category match → cell shows "Logged", is_covered = true, read-only. |
| Diet-logged priority | If a cell is diet-logged, any existing `meal_plan_entries` row for that slot is ignored in the display. |
| Week reset | `meal_plan_entries` rows from prior weeks are never shown. No deletion required — they simply fall outside the query window. |
| Pre-workout / Post-workout | These columns appear every day. If there is no workout that day, the user leaves them blank/unchecked. |
| Covered = green | Any cell where `is_covered = true` (or diet-logged) renders with a green background. Unchecking removes green. |
| Inline save | Changes to note (on blur) or checkbox (on change) are persisted immediately via upsert — no explicit save button. |

---

## 6. Data Model

New table: **`meal_plan_entries`**

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `user_id` | `uuid` FK → `auth.users` | Not null |
| `date` | `date` | Not null |
| `meal_category` | `text` | One of the 6 category values |
| `note` | `text` | Nullable |
| `is_covered` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | Default `now()` |

- Unique constraint on `(user_id, date, meal_category)`
- RLS enabled: `auth.uid() = user_id`

---

## 7. Out of Scope (Deferred)

- Week navigation (past or future weeks)
- Persistent history / meal plan archives
- Linking meal notes to the food or meal template library
- Copying a week's plan forward
- Mobile-optimised collapsed view (table scrolls horizontally on small screens)
- Per-meal-slot totals or coverage percentage summary

---

## 8. Assumptions

- The week starts on **Monday** (UTC-based ISO week).
- Today's row is visually highlighted in the day column.
- Old `meal_plan_entries` rows (prior weeks) are left in the database; excluded by the query window.
- The 6 meal category values match the `MealCategory` type in `src/app/diet/types.ts` exactly.
