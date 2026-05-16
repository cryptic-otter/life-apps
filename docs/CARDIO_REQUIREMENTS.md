# Cardio Page — Requirements Document
**Project:** Life Apps
**Prepared by:** Business Analyst
**Date:** 2026-05-16
**Status:** Draft v1.0

---

## 1. Background & Objective

The Cardio page currently functions as a generic session logger. The user follows a structured weekly swim programme and wants the page redesigned around that programme — reducing daily friction to a single confirmation tap on routine days, capturing richer performance context (sleep, fuel), and providing a clear at-a-glance picture of weekly consistency.

The page remains named **"Cardio"** to accommodate future activities (e.g. running) if the user returns to them.

---

## 2. Weekly Swim Schedule

This is the fixed planned programme the UI is built around.

| Day | Planned Distance | Day Type |
|---|---|---|
| Sunday | Rest | Rest (makeup allowed) |
| Monday | 1.0 mile | Fixed |
| Tuesday | 0.5 miles | Fixed |
| Wednesday | 1.0 – 1.5 miles | Range |
| Thursday | 0.5 miles | Fixed |
| Friday | Rest | Rest (bonus allowed) |
| Saturday | 1.5 – 2.0 miles | Range |

**Range days (Wednesday, Saturday)** always require the user to enter actual distance — no simple check-off. The distance field pre-fills with the lower bound of the range (1.0 mi on Wednesday, 1.5 mi on Saturday).

**Rest days (Sunday, Friday)** acknowledge the rest but allow the user to optionally log a swim if one was performed.

---

## 3. Page Layout

The Cardio page is a single scrollable page with four sections in order:

### 3.1 Today's Action Card
The primary interaction element, always visible at the top. Its content depends on the day type:

**Fixed swim day (Monday, Tuesday, Thursday)**
- Displays planned distance (e.g. *"Today: 1.0 mile"*)
- A **"Swim Performed"** button to confirm the swim at the planned distance (distance locked, non-editable)
- An **"Edit distance"** link to log a different distance
- Both paths open the full capture form (Sleep Quality, Fuel Level, Notes)

**Range day (Wednesday, Saturday)**
- Displays the planned range (e.g. *"Today: 1.0 – 1.5 miles"*)
- No checkbox — always shows the edit form directly
- Distance field pre-filled with lower bound
- Captures Sleep Quality, Fuel Level, and optional Notes

**Rest day (Sunday, Friday)**
- Displays *"Rest Day"*
- A secondary **"I swam today"** option that opens the full capture form
- Off-plan swims are captured identically to any other swim entry

**Already logged (any day type)**
- Shows summary: distance swam, sleep quality, fuel level, notes
- An **"Edit"** button re-opens the form with all fields pre-filled

### 3.2 Tomorrow's Preview Card
A styled card below the Today section showing the next day's planned swim.
- Format: *"0.5 miles"* or *"Rest Day"* or *"1.5–2.0 miles"*
- Range days include a note: *"Range — you'll enter your actual distance"*

### 3.3 Weekly Table
Displays the current week (Sunday through Saturday). Resets every Sunday.

**Columns:** Day | Planned | Actual | Status

**Row colour coding:**

| Colour | Meaning |
|---|---|
| Green | Swam at or above planned distance, or swim logged on a rest day (bonus) |
| Orange | Swam, but below planned distance (underswam) |
| Red | Swim day passed with no swim logged (missed) |
| Grey | Rest day with no swim logged |
| Neutral | Today or future — not yet resolved |

Today's row is highlighted in the Day column (blue text).

### 3.4 Past Swims (Editable History)
A scrollable list below the weekly table showing all logged swims from before the current week, up to **30 days ago**.

Each entry displays: Date, miles swam, sleep quality, and an **Edit** button.
Editing opens the full capture form inline, pre-filled with all existing values.

---

## 4. Capture Form — All Swim Submissions

Whether confirming a planned swim, submitting a range day, logging an off-plan swim, or editing a past entry, the following fields are always captured:

| Field | Type | Required | Options / Notes |
|---|---|---|---|
| Distance (miles) | Number | Yes | Pre-filled where applicable; locked when using "Swim Performed" |
| Sleep Quality | Dropdown | Yes | Great, Good, Average, Poor, Terrible |
| Fuel Level | Dropdown | Yes | Overfueled, Adequately Fueled, Underfueled |
| Notes | Text | No | Free text, optional |

---

## 5. Business Rules & Calculations

| Rule | Detail |
|---|---|
| Calorie calculation | `Calories = Actual miles × 600`. Calculated automatically on insert/update. Never displayed in the UI — backend only. |
| Range day default | Distance pre-fills to the lower bound (Wednesday → 1.0 mi, Saturday → 1.5 mi) |
| Missed swim detection | Any fixed or range swim day that has passed (date < today) with no logged entry is marked **Missed** (red) |
| Off-plan swim status | A swim logged on a rest day is marked **Bonus** (green) |
| Weekly table scope | Always shows Sun–Sat of the current calendar week; resets each Sunday |
| History scope | Past swims section shows entries from before the current week start, up to 30 days ago |
| Page name | Remains "Cardio" regardless of activity type |

---

## 6. Data Model Changes Required

New columns added to `cardio_sessions`:

| Column | Type | Notes |
|---|---|---|
| `distance_miles` | numeric | Actual miles swum |
| `planned_miles` | numeric | Scheduled distance for that day; null for off-plan swims |
| `sleep_quality` | text | Enum: great, good, average, poor, terrible |
| `fuel_level` | text | Enum: overfueled, adequately_fueled, underfueled |
| `calories` | integer | Computed on insert: actual miles × 600 |
| `is_off_plan` | boolean | True when logged on a rest day |

`duration_minutes` — made nullable (no longer captured in the swim flow).

---

## 7. Out of Scope (Deferred)

- **Stats Section:** Monthly consistency pie chart (Swim Performed / Not Performed / Added on Off Day) and cumulative mileage line chart. To be built as a separate page/tab when prioritised.

---

## 8. Assumptions

- The weekly schedule is fixed and does not change week-to-week. Programme changes will be updated in code (`schedule.ts`), not configured in the UI.
- A Supabase migration (`002_cardio_redesign.sql`) must be run in the Supabase SQL Editor before the new front-end is deployed.
- "Missed" status is determined at display time by comparing dates, not written as a separate database record.
- Dates are handled in UTC (consistent with the existing app behaviour).
- The user operates as a single user; no multi-user or timezone handling is required.

---

## 9. Implementation Sequencing

1. **Run the migration first** — new columns must exist before any inserts from the new UI.
2. **Build and test range days (Wed/Sat) first** — they are the most complex UI state.
3. **Missed swim detection** — ensure the date comparison correctly excludes today (today is not "missed" until it ends).
