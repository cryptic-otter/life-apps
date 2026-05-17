# Strength Tracker — Requirements Document
**Project:** Life Apps
**Prepared by:** Business Analyst
**Date:** 2026-05-17
**Status:** Draft v1.0

---

## 1. Background & Objective

The Strength page currently exists as a stub with basic logging. This redesign turns it into a full session logger built around a fixed 3-day weekly split. The primary goal is to log sets in real time during a session, with the previous session's performance visible upfront so the user always knows what weight to aim for.

---

## 2. Training Schedule

| Day | Muscle Groups |
|---|---|
| Tuesday | Legs, Shoulders |
| Thursday | Chest, Tris |
| Friday | Back, Bis |
| Mon / Wed / Sat / Sun | Rest |

Muscle group vocabulary is fixed to six values: **back, bis, chest, tris, shoulders, legs**.

---

## 3. Page Layout

### 3.1 — Header
Displays the current day name and its scheduled muscle groups (e.g. "Tuesday — Legs & Shoulders"). On a rest day, displays a rest day message. On rest days the log form is hidden by default but accessible via a "Log anyway" affordance.

### 3.2 — Previous Session Panel
Shown above the log form. Displays all sets from the most recent session where **any of today's scheduled muscle groups** were trained — regardless of how many weeks ago that was. Grouped by exercise. Shows: exercise name, and for each set: weight (lbs) × reps. No editing from this panel.

If no previous session exists for these muscle groups, the panel is hidden.

### 3.3 — Log Form
The primary input. Fields defined in Section 4. Sits below the previous session panel.

### 3.4 — Today's Sets
A running list of everything logged so far in today's session, grouped by exercise. Shown below the log form. Each set shows: exercise name, muscle group tag, weight × reps. Sets can be deleted.

---

## 4. Capture Form / Input Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Exercise | Dropdown + freetext | Yes | Populated from exercise library. Freetext fallback for bodyweight / unlisted exercises |
| Muscle group | Dropdown | Yes | Fixed values: back, bis, chest, tris, shoulders, legs. Auto-fills from library selection but editable |
| Weight (lbs) | Number | No | Pre-fills with last used weight for that exercise. Leave blank for bodyweight |
| Sets | Number | Yes | Integer ≥ 1 |
| Reps | Number | Yes | Integer ≥ 1 |
| Notes | Text | No | Open text field for bodyweight description or any other note |

---

## 5. Business Rules & Calculations

| Rule | Detail |
|---|---|
| Scheduled day detection | Map today's `dayOfWeek` to the fixed schedule. Tue → [legs, shoulders], Thu → [chest, tris], Fri → [back, bis], else → rest |
| Previous session lookup | Find the most recent `date` (before today) where at least one set exists with a `muscle_group` matching any of today's scheduled groups. Display all sets from that date |
| Weight pre-fill | On exercise selection, pre-fill weight with the `weight_lbs` value from the most recently logged set for that exercise |
| Muscle group auto-fill | On exercise selection from library, auto-populate the muscle group field from the exercise's stored tag. User can override |
| Rest day log access | Rest day message shown by default. A "Log anyway" toggle reveals the full log form with no muscle group pre-selection |

---

## 6. Data Model Changes Required

### New table: `exercises`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| user_id | uuid FK | → `auth.users.id`, RLS enabled |
| name | text | Exercise name |
| muscle_group | text | One of: back, bis, chest, tris, shoulders, legs |
| created_at | timestamptz | `now()` |

### Modified table: `strength_sets`

| Column | Change | Notes |
|---|---|---|
| `weight_kg` | Rename → `weight_lbs` | Table is empty, safe to replace |
| `muscle_group` | Add — text | One of the six fixed values |
| `exercise_id` | Add — uuid FK nullable | → `exercises.id`. Null for freetext/bodyweight entries |
| `exercise` | Keep | Stores freetext name; populated from library name on selection or typed directly |
| `notes` | Keep | Repurposed as bodyweight description / general notes |

---

## 7. Out of Scope (Deferred)

- Progression tracking over time (charts, trends)
- 1-rep max calculations
- Rest timers
- Planned vs actual comparison
- Per-exercise history view

---

## 8. Assumptions

- The exercise library lives at `/strength/library` — a dedicated page mirroring `/diet/library`
- An exercise can only have **one** muscle group tag (not multi-tag)
- Deleting a set from today's list is allowed; editing is not (delete and re-log)
- The previous session panel shows the single most recent matching date, not multiple past sessions
- Weight field accepts decimals (e.g. 137.5 lbs)

---

### Top 3 Implementation Risks

1. **Migration must run before any front-end work** — `weight_kg` rename and new columns on `strength_sets`, plus the new `exercises` table, are prerequisites for every other piece of this feature.
2. **Previous session query complexity** — finding the most recent date with matching muscle groups requires a subquery or CTE; needs to be efficient and correct for the "skipped week" edge case.
3. **Exercise library page** — needs to be built before the log form can function, since the dropdown depends on it. Sequence: library page → log form → main page layout.
